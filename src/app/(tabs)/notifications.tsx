import { Bell } from 'lucide-react-native';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function NotificationsRoute() {
  return (
    <PlaceholderScreen
      title="通知履歴"
      message="過去の通知一覧は準備中です。"
      Icon={Bell}
    />
  );
}
