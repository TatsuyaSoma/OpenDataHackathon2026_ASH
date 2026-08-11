import { Settings } from 'lucide-react-native';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function SettingsRoute() {
  return (
    <PlaceholderScreen
      title="設定"
      message="メンバー編集・お休みモード設定は準備中です。"
      Icon={Settings}
    />
  );
}
