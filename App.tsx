import React, { useState } from 'react';
import { HomeScreen } from './src/screens/HomeScreen';
import { CardDetailScreen } from './src/screens/CardDetailScreen';
import { Member } from './src/types';

/**
 * スタンドアロン確認用エントリポイント。
 * 実プロジェクトでは Expo Router（src/app/_layout.tsx 以下）がルーティングを担うため、
 * こちらは見た目確認や単体プレビュー用として残しています。
 */
export default function App() {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  if (selectedMember) {
    return (
      <CardDetailScreen
        member={selectedMember}
        onBack={() => setSelectedMember(null)}
      />
    );
  }

  return <HomeScreen onOpenMemberDetail={setSelectedMember} />;
}
