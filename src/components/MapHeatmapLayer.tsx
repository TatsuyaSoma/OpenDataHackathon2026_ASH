import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { Member } from '../types';
import { RISK_CONFIG } from '../constants/riskConfig';

interface Props {
  members: Member[]; // お休み中のメンバーは呼び出し側で除外して渡す
  positions: Record<string, { x: number; y: number }>;
}

// 仮想座標系（0〜100）でメンバーごとの危険度カラーの滲みを重ねてヒートマップ風に見せる。
// 年齢が高いほど暑さの影響を受けやすい想定で、滲みの半径をわずかに広げる。
export const MapHeatmapLayer: React.FC<Props> = ({ members, positions }) => {
  return (
    <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" pointerEvents="none">
      <Defs>
        {members.map((member) => (
          <RadialGradient key={member.id} id={`heat-${member.id}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={RISK_CONFIG[member.riskLevel].color} stopOpacity={0.55} />
            <Stop offset="100%" stopColor={RISK_CONFIG[member.riskLevel].color} stopOpacity={0} />
          </RadialGradient>
        ))}
      </Defs>
      {members.map((member) => {
        const position = positions[member.id];
        if (!position) return null;
        const radius = 16 + (member.age / 100) * 14;
        return (
          <Circle
            key={member.id}
            cx={position.x * 100}
            cy={position.y * 100}
            r={radius}
            fill={`url(#heat-${member.id})`}
          />
        );
      })}
    </Svg>
  );
};
