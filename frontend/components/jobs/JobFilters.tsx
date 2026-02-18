'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export type JobStatus = 'new' | 'queued' | 'scored' | 'archived' | 'pending_upgrade';

interface JobFiltersProps {
  minScore: number | null;
  maxScore: number | null;
  status: JobStatus | 'all';
  startDate: string;
  endDate: string;
  searchQuery: string;
  onMinScoreChange: (score: number | null) => void;
  onMaxScoreChange: (score: number | null) => void;
  onStatusChange: (status: JobStatus | 'all') => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
}

export function JobFilters({
  minScore,
  maxScore,
  status,
  startDate,
  endDate,
  searchQuery,
  onMinScoreChange,
  onMaxScoreChange,
  onStatusChange,
  onStartDateChange,
  onEndDateChange,
  onSearchChange,
  onClearFilters,
}: JobFiltersProps) {
  const hasActiveFilters =
    minScore !== null ||
    maxScore !== null ||
    status !== 'all' ||
    startDate !== '' ||
    endDate !== '' ||
    searchQuery !== '';

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="gap-2">
            <X className="h-4 w-4" />
            Clear all
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search in title, description, URL..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={(value) => onStatusChange(value as JobStatus | 'all')}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
              <SelectItem value="scored">Scored</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
              <SelectItem value="pending_upgrade">Pending Upgrade</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Min Score */}
        <div className="space-y-2">
          <Label htmlFor="min-score">Min Score</Label>
          <Select
            value={minScore?.toString() || 'all'}
            onValueChange={(value) => {
              if (value === 'all') {
                onMinScoreChange(null);
              } else {
                onMinScoreChange(parseInt(value, 10));
              }
            }}
          >
            <SelectTrigger id="min-score">
              <SelectValue placeholder="All scores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All scores</SelectItem>
              <SelectItem value="1">1+</SelectItem>
              <SelectItem value="4">4+</SelectItem>
              <SelectItem value="7">7+</SelectItem>
              <SelectItem value="9">9+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Max Score */}
        <div className="space-y-2">
          <Label htmlFor="max-score">Max Score</Label>
          <Select
            value={maxScore?.toString() || 'all'}
            onValueChange={(value) => {
              if (value === 'all') {
                onMaxScoreChange(null);
              } else {
                onMaxScoreChange(parseInt(value, 10));
              }
            }}
          >
            <SelectTrigger id="max-score">
              <SelectValue placeholder="All scores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All scores</SelectItem>
              <SelectItem value="3">Up to 3</SelectItem>
              <SelectItem value="6">Up to 6</SelectItem>
              <SelectItem value="8">Up to 8</SelectItem>
              <SelectItem value="10">Up to 10</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Start Date */}
        <div className="space-y-2">
          <Label htmlFor="start-date">Start Date</Label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
          />
        </div>

        {/* End Date */}
        <div className="space-y-2">
          <Label htmlFor="end-date">End Date</Label>
          <Input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
