
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
    Online: 'text-cyan-600 bg-cyan-500/20',
    Moving: 'text-green-600 bg-green-500/20',
    Idle: 'text-sky-600 bg-sky-500/20',
    Alarm: 'text-red-600 bg-red-500/20 animate-pulse',
    Offline: 'text-gray-600 bg-gray-500/20',
    Maintenance: 'text-orange-600 bg-orange-500/20',
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'border-0 text-xs font-medium px-3 py-1', 
        statusStyles[status], 
        className
      )}
    >
      {statusTranslations[status] || status}
    </Badge>
  );
}
