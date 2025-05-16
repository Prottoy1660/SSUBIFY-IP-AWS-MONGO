
import type { SubmissionStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: SubmissionStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusColors: Record<SubmissionStatus, string> = {
    Pending: 'bg-accent text-accent-foreground hover:bg-accent/90', // Amber
    Successful: 'bg-green-500 text-white hover:bg-green-500/90', // Green
    Canceled: 'bg-red-500 text-white hover:bg-red-500/90', // Red
  };

  return (
    <Badge className={cn('capitalize', statusColors[status])}>
      {status}
    </Badge>
  );
}
