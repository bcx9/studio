
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
    Online: 'text-cyan-400 bg-cyan-900/50 border-cyan-500/50',
    Moving: 'text-green-400 bg-green-900/50 border-green-500/50',
    Idle: 'text-blue-400 bg-blue-900/50 border-blue-500/50',
    Alarm: 'text-red-400 bg-red-900/50 border-red-500/50 animate-pulse',
    Offline: 'text-gray-400 bg-gray-900/50 border-gray-500/50',
    Maintenance: 'text-orange-400 bg-orange-900/50 border-orange-500/50',
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs font-medium px-2.5 py-1', 
        statusStyles[status], 
        className
      )}
    >
      {statusTranslations[status] || status}
    </Badge>
  );
}
