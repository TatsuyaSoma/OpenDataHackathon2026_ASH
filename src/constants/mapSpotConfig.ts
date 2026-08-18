import { Coffee, Droplet, LifeBuoy, Refrigerator, Store } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { MapSpotType } from '../types';

export interface MapSpotConfigItem {
  label: string;
  color: string;
  Icon: LucideIcon;
}

// スポット種別ごとの見た目定義（ピン・凡例の両方で共通利用）
export const MAP_SPOT_CONFIG: Record<MapSpotType, MapSpotConfigItem> = {
  convenience: { label: 'コンビニ', color: '#4CAF50', Icon: Store },
  vending: { label: '自販機', color: '#8E24AA', Icon: Refrigerator },
  water: { label: '給水スポット', color: '#2196F3', Icon: Droplet },
  disasterWater: { label: '災害時給水', color: '#00838F', Icon: LifeBuoy },
  cafe: { label: 'カフェ', color: '#FB8C00', Icon: Coffee },
};
