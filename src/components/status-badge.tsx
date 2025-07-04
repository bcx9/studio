import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { UnitStatus } from '@/types/mesh';

interface StatusBadgeProps {
  status: UnitStatus;
  className?: string;
}

const statusTranslations: Record<UnitStatus, string> = {
  Online: 'Online',
  Moving: 'In Bewegung',
  Idle: 'Inaktiv',
  Alarm: 'Alarm',
  Offline: 'Offline',
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusStyles: Record<UnitStatus, string> = {
    Online: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    Moving: 'bg-green-500/20 text-green-400 border-green-500/30',
    Idle: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    Alarm: 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse',
    Offline: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-normal', statusStyles[status], className)}
    >
      {statusTranslations[status]}
    </Badge>
  );
}
