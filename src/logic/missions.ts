import { MISSIONS, MISSION_COOLDOWN_MS } from '../constants/missions';

export interface MissionRuntimeState {
  id: string;
  label: string;
  points: number;
  onCooldown: boolean; // 直近1時間以内に達成済みで、現在「クリア中」の状態かどうか
  available: boolean; // タップして達成にできるか（クールダウンが明けている）
  remainingMs: number; // クールダウン中の残り時間（ミリ秒。クールダウン中でなければ0）
}

/**
 * メンバーのミッション達成記録（missionCompletions）から、各ミッションの現在の状態を算出する。
 * お休みモード中もミッションは実施でき、クールダウン中のみ達成不可になる。
 */
export const computeMissionStates = (
  completions: Record<string, string> | undefined,
  isResting: boolean,
  now: number = Date.now()
): MissionRuntimeState[] =>
  MISSIONS.map((mission) => {
    const completedAt = completions?.[mission.id];
    const elapsed = completedAt ? now - new Date(completedAt).getTime() : Infinity;
    const onCooldown = elapsed < MISSION_COOLDOWN_MS;
    return {
      id: mission.id,
      label: mission.label,
      points: mission.points,
      onCooldown,
      available: !onCooldown,
      remainingMs: onCooldown ? MISSION_COOLDOWN_MS - elapsed : 0,
    };
  });

// 全ミッションが同時にクリア中（onCooldown）の状態かどうか
export const areAllMissionsCleared = (states: MissionRuntimeState[]): boolean =>
  states.length > 0 && states.every((state) => state.onCooldown);
