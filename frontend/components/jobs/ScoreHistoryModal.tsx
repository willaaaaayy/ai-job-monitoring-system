'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { jobsApi } from '@/lib/api';
import { ScoringHistory } from '@/types/job';
import { Skeleton } from '@/components/ui/skeleton';
import { History } from 'lucide-react';
import { format } from 'date-fns';

interface ScoreHistoryModalProps {
  jobId: string;
}

export function ScoreHistoryModal({ jobId }: ScoreHistoryModalProps) {
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery<{ success: boolean; data: ScoringHistory[] }>({
    queryKey: ['job-history', jobId],
    queryFn: () => jobsApi.getHistory(jobId),
    enabled: open,
  });

  const history = data?.data || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="mr-2 h-4 w-4" />
          View History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Scoring History</DialogTitle>
          <DialogDescription>Complete timeline of scoring events for this job</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No scoring history available</div>
          ) : (
            <div className="space-y-4">
              {history.map((item, index) => (
                <div key={item.id} className="border-l-2 border-primary pl-4 pb-4 relative">
                  {index < history.length - 1 && (
                    <div className="absolute left-[-1px] top-8 bottom-0 w-0.5 bg-border" />
                  )}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-semibold">Score: {item.score}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(item.createdAt), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.reason}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
