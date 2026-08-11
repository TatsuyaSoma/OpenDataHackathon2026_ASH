import { useRouter } from 'expo-router';
import { NotificationsScreen } from '@/screens/NotificationsScreen';
import { Member, NotificationItem } from '@/types';

export default function NotificationsRoute() {
  const router = useRouter();

  return (
    <NotificationsScreen
      onOpenMemberDetail={(member: Member, notification: NotificationItem) =>
        router.push({
          pathname: '/member/[id]',
          params: {
            id: member.id,
            snapshotTime: notification.time,
            snapshotRisk: notification.riskLevel,
            snapshotLocation: notification.location,
          },
        })
      }
    />
  );
}
