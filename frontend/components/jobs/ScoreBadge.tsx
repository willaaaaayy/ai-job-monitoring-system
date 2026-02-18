import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ScoreBadgeProps {
  score: number | null;
  className?: string;
}

export function ScoreBadge({ score, className }: ScoreBadgeProps) {
  if (score === null) {
    return (
      <Badge variant="secondary" className={cn(className)}>
        N/A
      </Badge>
    );
  }

  let variant: 'destructive' | 'warning' | 'success' = 'destructive';
  if (score >= 7) {
    variant = 'success';
  } else if (score >= 4) {
    variant = 'warning';
  }

  return (
    <Badge variant={variant} className={cn(className)}>
      {score}/10
    </Badge>
  );
}
