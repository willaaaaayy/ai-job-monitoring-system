import { Badge } from '@/components/ui/badge';
import { JobStatus } from '@/types/job';
import { cn } from '@/lib/utils';

interface JobStatusBadgeProps {
  status: JobStatus;
  className?: string;
}

const statusConfig: Record<JobStatus, { label: string; variant: 'default' | 'secondary' | 'info' | 'warning' | 'success' }> = {
  new: { label: 'New', variant: 'info' },
  queued: { label: 'Queued', variant: 'warning' },
  scored: { label: 'Scored', variant: 'success' },
  archived: { label: 'Archived', variant: 'secondary' },
};

export function JobStatusBadge({ status, className }: JobStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={cn(className)}>
      {config.label}
    </Badge>
  );
}
