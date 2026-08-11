import { MapPin } from 'lucide-react-native';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function MapRoute() {
  return (
    <PlaceholderScreen
      title="マップ"
      message="地図・メンバーのアイコン表示は準備中です。"
      Icon={MapPin}
    />
  );
}
