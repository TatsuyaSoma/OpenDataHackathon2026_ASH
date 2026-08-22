import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { MISSIONS, MISSION_ALL_CLEAR_BONUS } from '../constants/missions';
import { isHighRisk } from '../constants/riskConfig';
import { mockMembers } from '../data/mockData';
import { computeMissionStates } from '../logic/missions';
import { estimateRiskLevel, estimateRiskScore } from '../logic/riskCalculation';
import { applyVitalityTick } from '../logic/vitalityGauge';
import { fetchNearestWeatherBatch } from '../services/amedasWeather';
import {
    requestNotificationPermission,
    sendDangerNotification,
    sendVitalityReminderNotification,
} from '../services/localNotifications';
import { Member } from '../types';
import { useNotifications } from './NotificationsContext';

interface MembersContextValue {
  members: Member[];
  getMemberById: (id: string) => Member | undefined;
  addMember: (member: Member) => void;
  updateMember: (member: Member) => void;
  removeMember: (id: string) => void;
  removeAllMembers: () => void;
  reorderMembers: (orderedIds: string[]) => void;
  toggleResting: (id: string) => void;
  completeMission: (memberId: string, missionId: string) => void;
}

// getHours()/getMinutes()は端末のシステムタイムゾーン依存（エミュレータ等でUTCになっている場合、
// 実際の日本時間と9時間ずれて表示されてしまう）。端末設定に関わらず常に日本時間（JST）で
// 表示するため、UTC時刻からJST（UTC+9固定、夏時間なし）へ手動で変換する。
const JST_OFFSET_MINUTES = 9 * 60;

const formatTimeLabel = (date: Date) => {
  const jstTotalMinutes = (date.getUTCHours() * 60 + date.getUTCMinutes() + JST_OFFSET_MINUTES) % (24 * 60);
  const hours = Math.floor(jstTotalMinutes / 60);
  const minutes = jstTotalMinutes % 60;
  return `${hours}:${String(minutes).padStart(2, '0')}`;
};

// 体力ゲージを再計算する間隔。実時間ではなくデモで動きが見える速さを優先している
// （増減ペース自体はsrc/logic/vitalityGauge.tsのDECAY_RATE_PER_MINUTE等で調整する）
const VITALITY_TICK_INTERVAL_MS = 5000;

// 気温に上乗せする補正値（℃）。アメダス実測値は日陰基準のため、これだけだと危険度が低めに出て
// 体力ゲージが動かないことがあるため、屋外での体感に近づける形で全メンバー分を一律に高めに補正する。
const OUTDOOR_FEELS_LIKE_BOOST_CELSIUS = 5;

// メンバー全員分の気温・湿度を、それぞれの現在地に最も近いアメダス実測値で更新する間隔
const WEATHER_REFRESH_INTERVAL_MS = 10 * 60 * 1000;

// メンバーの体力ゲージがこの値を下回るたびに、回復を促すリマインダー通知を送る（高い順）
const VITALITY_REMINDER_THRESHOLDS = [70, 40];

// メンバー一覧をローカル端末に永続化する際のAsyncStorageキー
const MEMBERS_STORAGE_KEY = '@family-heatstroke-watch/members';

const MembersContext = createContext<MembersContextValue | undefined>(undefined);

/**
 * 見守りメンバー一覧をアプリ全体で共有するstate。
 * ホーム／マップ／通知履歴／設定／メンバ登録・編集の各画面が同じ一覧を参照・更新できるようにする
 * （設定画面でのメンバ編集を他画面にも反映させるために導入）。
 * データソースはモックのため、実装時はAPI連携のstate管理に置き換える想定。
 */
export const MembersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addNotification } = useNotifications();
  const [members, setMembers] = useState<Member[]>(mockMembers);
  // 起動直後の読み込み完了前に、モックの初期値でストレージを上書きしてしまわないようにするためのフラグ
  const hasHydratedRef = useRef(false);

  // 起動時に、端末に永続化されたメンバー一覧があれば読み込む（無ければモックのまま）
  useEffect(() => {
    AsyncStorage.getItem(MEMBERS_STORAGE_KEY)
      .then((json) => {
        if (json) setMembers(JSON.parse(json));
      })
      .catch((error) => console.warn('メンバー情報の読み込みに失敗しました:', error))
      .finally(() => {
        hasHydratedRef.current = true;
      });
  }, []);

  // メンバー一覧が変化するたびに端末へ永続化する
  useEffect(() => {
    if (!hasHydratedRef.current) return;
    AsyncStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(members)).catch((error) =>
      console.warn('メンバー情報の保存に失敗しました:', error)
    );
  }, [members]);

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

  // 設定画面「メンバの並び順を変更」からの並び替えを反映する。渡された順序に無いIDが
  // 混ざっていた場合に備え、末尾に元の並びのまま残す（データ欠落を防ぐための保険）。
  const reorderMembers = useCallback((orderedIds: string[]) => {
    setMembers((prev) => {
      const byId = new Map(prev.map((member) => [member.id, member]));
      const orderedIdSet = new Set(orderedIds);
      const reordered = orderedIds
        .map((id) => byId.get(id))
        .filter((member): member is Member => member !== undefined);
      const remaining = prev.filter((member) => !orderedIdSet.has(member.id));
      return [...reordered, ...remaining];
    });
  }, []);

  // お休みモードのON/OFFを切り替える。ミッションの達成記録とクールダウンは保持する。
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

  // ミッションを1つ達成する。クールダウン中は何もしない（呼び出し元のUIでも
  // ボタンをdisabledにしているが、念のためここでも同じ判定で二重にガードする）。
  // 3つ全部を同時にクリア中の状態になった瞬間、1回だけ全クリアボーナスを追加で回復させる。
  const completeMission = useCallback((memberId: string, missionId: string) => {
    setMembers((prev) =>
      prev.map((member) => {
        if (member.id !== memberId) return member;

        const states = computeMissionStates(member.missionCompletions, member.isResting);
        const target = states.find((state) => state.id === missionId);
        if (!target?.available) return member;

        const mission = MISSIONS.find((m) => m.id === missionId);
        if (!mission) return member;

        const nowIso = new Date().toISOString();
        const missionCompletions = { ...(member.missionCompletions ?? {}), [missionId]: nowIso };

        let vitality = Math.min(100, member.vitality + mission.points);

        const allCleared = computeMissionStates(missionCompletions, member.isResting).every(
          (state) => state.onCooldown
        );
        let missionAllClearBonusGiven = member.missionAllClearBonusGiven ?? false;
        if (allCleared && !missionAllClearBonusGiven) {
          vitality = Math.min(100, vitality + MISSION_ALL_CLEAR_BONUS);
          missionAllClearBonusGiven = true;
        } else if (!allCleared) {
          missionAllClearBonusGiven = false;
        }

        return { ...member, missionCompletions, vitality, missionAllClearBonusGiven };
      })
    );
  }, []);

  // 体力ゲージを一定間隔で再計算する。危険な状態が続くと減り、お休み中や安全な状態では回復する。
  useEffect(() => {
    const elapsedMinutes = VITALITY_TICK_INTERVAL_MS / 60000;
    const intervalId = setInterval(() => {
      setMembers((prev) =>
        prev.map((member) => {
          const currentRiskLevel = estimateRiskLevel({ ...member.environment, age: member.age });
          return {
            ...member,
            vitality: applyVitalityTick(member.vitality, currentRiskLevel, member.isResting, elapsedMinutes),
          };
        })
      );
    }, VITALITY_TICK_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, []);

  // メンバーの位置（モックの登録住所。実際の現在地取得は行わない）は変えず、気温・湿度だけを
  // それぞれの位置に最も近い気象庁アメダス観測地点の実データで更新する。これにより、危険度が
  // メンバーごとの居場所に対応した値になる（登録住所が近い者同士は同じ観測地点の値を共有する）。
  const locationsKey = members
    .map((member) => `${member.id}:${member.location.latitude},${member.location.longitude}`)
    .join('|');

  useEffect(() => {
    if (members.length === 0) return;
    let cancelled = false;

    const refresh = () => {
      const points = members.map((member) => ({
        id: member.id,
        latitude: member.location.latitude,
        longitude: member.location.longitude,
      }));

      fetchNearestWeatherBatch(points)
        .then((results) => {
          if (cancelled || results.size === 0) return;
          setMembers((prev) =>
            prev.map((member) => {
              const weather = results.get(member.id);
              if (!weather) return member;
              return {
                ...member,
                environment: {
                  ...member.environment,
                  temperature: weather.temperature + OUTDOOR_FEELS_LIKE_BOOST_CELSIUS,
                  humidity: weather.humidity,
                },
                lastUpdated: formatTimeLabel(new Date()),
              };
            })
          );
        })
        .catch((error) => console.warn('メンバーの気象データ取得に失敗しました:', error));
    };

    refresh();
    const intervalId = setInterval(refresh, WEATHER_REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [locationsKey]);

  // 全メンバーの体力ゲージが一定のしきい値を下回るたびに、ローカル通知を送り通知履歴にも記録する
  // （しきい値を跨ぐたびに1回だけ通知するので、ゲージが下がり続ける間は段階的に複数回届く）。
  // 本人は水分補給・休憩を促すメッセージ、他メンバーは見守っている本人へ向けて声かけを促すメッセージにする。
  const previousVitalityRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    derivedMembers.forEach((member) => {
      const previousVitality = previousVitalityRef.current.get(member.id);
      previousVitalityRef.current.set(member.id, member.vitality);
      if (previousVitality === undefined) return; // 初回読み込み時は判定しない

      const crossedThreshold = VITALITY_REMINDER_THRESHOLDS.find(
        (threshold) => previousVitality > threshold && member.vitality <= threshold
      );
      if (crossedThreshold === undefined) return;

      const isSevere = crossedThreshold < 50;
      const message = member.isSelf
        ? isSevere
          ? '体力ゲージがかなり減っています。涼しい場所で休憩しましょう。'
          : '体力ゲージが減ってきています。水分補給をしましょう。'
        : isSevere
          ? `${member.name}の体力ゲージが大きく減っています。休憩するよう声をかけてあげましょう。`
          : `${member.name}の体力ゲージが減ってきています。水分補給を促してあげましょう。`;

      requestNotificationPermission().then((granted) => {
        if (granted) sendVitalityReminderNotification(message);
      });

      addNotification({
        id: `vitality-${member.id}-${Date.now()}`,
        memberId: member.id,
        riskLevel: member.riskLevel,
        message,
        changed: true,
        location: member.location.address,
        time: formatTimeLabel(new Date()),
        dateLabel: '今日',
        isRead: false,
      });
    });
  }, [derivedMembers, addNotification]);

  // 本人の危険度が「危険」以上になった瞬間に、体力ゲージの減少として端末通知で知らせる
  // （サーバーを介さないため、他メンバーの端末には届かない）
  const previousSelfHighRiskRef = useRef(false);

  useEffect(() => {
    const self = derivedMembers.find((member) => member.isSelf);
    if (!self) return;

    const isCurrentlyHighRisk = isHighRisk(self.riskLevel);
    if (isCurrentlyHighRisk && !previousSelfHighRiskRef.current) {
      const message = `${self.name}の体力ゲージが減ってきています。水分補給や涼しい場所での休憩を心がけてください。`;
      requestNotificationPermission().then((granted) => {
        if (granted) sendDangerNotification(message);
      });
      addNotification({
        id: `danger-${self.id}-${Date.now()}`,
        memberId: self.id,
        riskLevel: self.riskLevel,
        message,
        changed: true,
        location: self.location.address,
        time: formatTimeLabel(new Date()),
        dateLabel: '今日',
        isRead: false,
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
      reorderMembers,
      toggleResting,
      completeMission,
    }),
    [
      derivedMembers,
      getMemberById,
      addMember,
      updateMember,
      removeMember,
      removeAllMembers,
      reorderMembers,
      toggleResting,
      completeMission,
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
