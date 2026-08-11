import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Member } from '../types';
import { mockMembers } from '../data/mockData';
import { DeviceLocationStatus, useDeviceLocation } from '../hooks/use-device-location';
import { useNearbyWeather } from '../hooks/use-nearby-weather';

interface MembersContextValue {
  members: Member[];
  getMemberById: (id: string) => Member | undefined;
  addMember: (member: Member) => void;
  updateMember: (member: Member) => void;
  removeAllMembers: () => void;
  toggleResting: (id: string) => void;
  selfLocationStatus: DeviceLocationStatus;
  refreshSelfLocation: () => void;
}

const formatTimeLabel = (date: Date) => `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;

const MembersContext = createContext<MembersContextValue | undefined>(undefined);

/**
 * 見守りメンバー一覧をアプリ全体で共有するstate。
 * ホーム／マップ／通知履歴／設定／メンバ登録・編集の各画面が同じ一覧を参照・更新できるようにする
 * （設定画面でのメンバ編集を他画面にも反映させるために導入）。
 * データソースはモックのため、実装時はAPI連携のstate管理に置き換える想定。
 */
export const MembersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [members, setMembers] = useState<Member[]>(mockMembers);

  const getMemberById = useCallback(
    (id: string) => members.find((member) => member.id === id),
    [members]
  );

  const addMember = useCallback((member: Member) => {
    setMembers((prev) => [...prev, member]);
  }, []);

  const updateMember = useCallback((updated: Member) => {
    setMembers((prev) => prev.map((member) => (member.id === updated.id ? updated : member)));
  }, []);

  const removeAllMembers = useCallback(() => {
    setMembers([]);
  }, []);

  // お休みモードのON/OFFを切り替える。ONにした瞬間の時刻を開始時刻として記録する。
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
          return {
            ...member,
            location: {
              address: address ?? member.location.address,
              latitude,
              longitude,
            },
            lastUpdated: formatTimeLabel(new Date()),
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

  const value = useMemo(
    () => ({
      members,
      getMemberById,
      addMember,
      updateMember,
      removeAllMembers,
      toggleResting,
      selfLocationStatus: deviceLocation.status,
      refreshSelfLocation: deviceLocation.refresh,
    }),
    [
      members,
      getMemberById,
      addMember,
      updateMember,
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
