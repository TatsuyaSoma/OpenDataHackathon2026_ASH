import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Member } from '../types';
import { mockMembers } from '../data/mockData';

interface MembersContextValue {
  members: Member[];
  getMemberById: (id: string) => Member | undefined;
  addMember: (member: Member) => void;
  updateMember: (member: Member) => void;
  removeAllMembers: () => void;
  toggleResting: (id: string) => void;
}

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
        const timeLabel = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
        return {
          ...member,
          isResting: nextResting,
          restStartedAt: nextResting ? timeLabel : undefined,
        };
      })
    );
  }, []);

  const value = useMemo(
    () => ({ members, getMemberById, addMember, updateMember, removeAllMembers, toggleResting }),
    [members, getMemberById, addMember, updateMember, removeAllMembers, toggleResting]
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
