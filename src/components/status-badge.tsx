
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
  Maintenance: 'Wartung',
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusStyles: Record<UnitStatus, string> = {
    Online: 'border-cyan-400/50 text-cyan-400 bg-cyan-500/10',
    Moving: 'border-green-400/50 text-green-400 bg-green-500/10',
    Idle: 'border-sky-400/50 text-sky-400 bg-sky-500/10',
    Alarm: 'border-red-400/50 text-red-400 bg-red-500/10 animate-pulse',
    Offline: 'border-gray-400/50 text-gray-400 bg-gray-500/10',
    Maintenance: 'border-orange-400/50 text-orange-400 bg-orange-500/10',
  };

  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-normal', statusStyles[status], className)}
    >
      {statusTranslations[status] || status}
    </Badge>
  );
}
