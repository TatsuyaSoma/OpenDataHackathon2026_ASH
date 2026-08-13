import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Member } from '../types';
import { mockMembers } from '../data/mockData';
import { DeviceLocationStatus, useDeviceLocation } from '../hooks/use-device-location';
import { useNearbyWeather } from '../hooks/use-nearby-weather';
import { estimateRiskLevel, estimateRiskScore } from '../logic/riskCalculation';
import { isHighRisk, RISK_CONFIG } from '../constants/riskConfig';
import { haversineDistanceMeters } from '../utils/geo';
import { requestNotificationPermission, sendDangerNotification } from '../services/localNotifications';

interface MembersContextValue {
  members: Member[];
  getMemberById: (id: string) => Member | undefined;
  addMember: (member: Member) => void;
  updateMember: (member: Member) => void;
  removeMember: (id: string) => void;
  removeAllMembers: () => void;
  toggleResting: (id: string) => void;
  selfLocationStatus: DeviceLocationStatus;
  refreshSelfLocation: () => void;
}

const formatTimeLabel = (date: Date) => `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;

// お休み開始地点からこの距離（メートル）以上動いたら、自動でお休みモードを解除する
const REST_AUTO_RELEASE_DISTANCE_METERS = 300;

const MembersContext = createContext<MembersContextValue | undefined>(undefined);

/**
 * 見守りメンバー一覧をアプリ全体で共有するstate。
 * ホーム／マップ／通知履歴／設定／メンバ登録・編集の各画面が同じ一覧を参照・更新できるようにする
 * （設定画面でのメンバ編集を他画面にも反映させるために導入）。
 * データソースはモックのため、実装時はAPI連携のstate管理に置き換える想定。
 */
export const MembersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [members, setMembers] = useState<Member[]>(mockMembers);

  // riskLevel/riskScoreは保存済みの値をそのまま信用せず、現在の気温・湿度から都度算出する
  // （算出ロジックはsrc/logic/riskCalculation.tsに集約しており、差し替えるとここにも自動で反映される）
  const derivedMembers = useMemo(
    () =>
      members.map((member) => ({
        ...member,
        riskLevel: estimateRiskLevel({ ...member.environment, age: member.age }),
        riskScore: estimateRiskScore({ ...member.environment, age: member.age }),
      })),
    [members]
  );

  const getMemberById = useCallback(
    (id: string) => derivedMembers.find((member) => member.id === id),
    [derivedMembers]
  );

  const addMember = useCallback((member: Member) => {
    setMembers((prev) => [...prev, member]);
  }, []);

  const updateMember = useCallback((updated: Member) => {
    setMembers((prev) => prev.map((member) => (member.id === updated.id ? updated : member)));
  }, []);

  const removeMember = useCallback((id: string) => {
    setMembers((prev) => prev.filter((member) => member.id !== id));
  }, []);

  const removeAllMembers = useCallback(() => {
    setMembers([]);
  }, []);

  // お休みモードのON/OFFを切り替える。ONにした瞬間の時刻・位置（本人のみ）を記録する。
  // 記録した位置は、自動解除の判定（後述のuseEffect）に使う。
  const toggleResting = useCallback((id: string) => {
    setMembers((prev) =>
      prev.map((member) => {
        if (member.id !== id) return member;
        const nextResting = !member.isResting;
        const now = new Date();
        return {
          ...member,
          isResting: nextResting,
          restStartedAt: nextResting ? formatTimeLabel(now) : undefined,
          restStartedLocation:
            nextResting && member.isSelf
              ? { latitude: member.location.latitude, longitude: member.location.longitude }
              : undefined,
        };
      })
    );
  }, []);

  // この端末を使っている本人（isSelf: true のメンバー）の位置情報を、実際の現在地で自動更新する
  const deviceLocation = useDeviceLocation();

  useEffect(() => {
    const { status, latitude, longitude, address, errorMessage } = deviceLocation;
    if (status === 'requesting') return;

    setMembers((prev) =>
      prev.map((member) => {
        if (!member.isSelf) return member;
        if (status === 'granted' && latitude !== undefined && longitude !== undefined) {
          // お休み中に、開始地点から一定距離以上動いたら自動でお休みモードを解除する
          const movedAwayFromRestStart =
            member.isResting &&
            member.restStartedLocation !== undefined &&
            haversineDistanceMeters(
              member.restStartedLocation.latitude,
              member.restStartedLocation.longitude,
              latitude,
              longitude
            ) > REST_AUTO_RELEASE_DISTANCE_METERS;

          return {
            ...member,
            location: {
              address: address ?? member.location.address,
              latitude,
              longitude,
            },
            lastUpdated: formatTimeLabel(new Date()),
            ...(movedAwayFromRestStart
              ? { isResting: false, restStartedAt: undefined, restStartedLocation: undefined }
              : {}),
          };
        }
        if (status === 'denied') {
          return {
            ...member,
            location: { ...member.location, address: '位置情報の利用が許可されていません' },
          };
        }
        if (status === 'error') {
          return {
            ...member,
            location: { ...member.location, address: errorMessage ?? '現在地を取得できませんでした' },
          };
        }
        return member;
      })
    );
  }, [
    deviceLocation.status,
    deviceLocation.latitude,
    deviceLocation.longitude,
    deviceLocation.address,
    deviceLocation.errorMessage,
  ]);

  // 本人の実際の現在地に対応する気温・湿度を、気象庁アメダスの実データで自動更新する
  const nearbyWeather = useNearbyWeather(deviceLocation.latitude, deviceLocation.longitude);

  useEffect(() => {
    if (nearbyWeather.status !== 'success' || !nearbyWeather.weather) return;
    const { temperature, humidity } = nearbyWeather.weather;

    setMembers((prev) =>
      prev.map((member) =>
        member.isSelf
          ? { ...member, environment: { ...member.environment, temperature, humidity } }
          : member
      )
    );
  }, [nearbyWeather.status, nearbyWeather.weather]);

  // 本人の危険度が「危険」以上になった瞬間に、端末のローカル通知で知らせる
  // （サーバーを介さないため、他メンバーの端末には届かない）
  const previousSelfHighRiskRef = useRef(false);

  useEffect(() => {
    const self = derivedMembers.find((member) => member.isSelf);
    if (!self) return;

    const isCurrentlyHighRisk = isHighRisk(self.riskLevel);
    if (isCurrentlyHighRisk && !previousSelfHighRiskRef.current) {
      requestNotificationPermission().then((granted) => {
        if (granted) sendDangerNotification(self.name, RISK_CONFIG[self.riskLevel].label);
      });
    }
    previousSelfHighRiskRef.current = isCurrentlyHighRisk;
  }, [derivedMembers]);

  const value = useMemo(
    () => ({
      members: derivedMembers,
      getMemberById,
      addMember,
      updateMember,
      removeMember,
      removeAllMembers,
      toggleResting,
      selfLocationStatus: deviceLocation.status,
      refreshSelfLocation: deviceLocation.refresh,
    }),
    [
      derivedMembers,
      getMemberById,
      addMember,
      updateMember,
      removeMember,
      removeAllMembers,
      toggleResting,
      deviceLocation.status,
      deviceLocation.refresh,
    ]
  );

  return <MembersContext.Provider value={value}>{children}</MembersContext.Provider>;
};

export const useMembers = (): MembersContextValue => {
  const context = useContext(MembersContext);
  if (!context) {
    throw new Error('useMembers は MembersProvider の内側でのみ使用できます。');
  }
  return context;
};
