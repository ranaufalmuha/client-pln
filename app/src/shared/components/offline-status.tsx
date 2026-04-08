// Offline status indicator component
'use client';

import * as React from 'react';
import { WifiOff, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { useOffline } from '@/shared/lib/offline-hooks';
import { Button } from '@/shared/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import { cn } from '@/shared/lib/utils';

export function OfflineStatusIndicator(): React.ReactElement | null {
  const { isOnline, isOffline, pendingCount, isSyncing } = useOffline();

  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              isOffline
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : isSyncing
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : pendingCount > 0
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            )}
          >
            {isOffline ? (
              <>
                <WifiOff className="h-4 w-4" />
                <span>Offline</span>
              </>
            ) : isSyncing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Syncing...</span>
              </>
            ) : pendingCount > 0 ? (
              <>
                <AlertCircle className="h-4 w-4" />
                <span>{pendingCount} pending</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Synced</span>
              </>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {isOffline
            ? 'You are offline. Changes will be saved locally and synced when you reconnect.'
            : isSyncing
            ? 'Syncing pending changes to the server...'
            : pendingCount > 0
            ? `${pendingCount} changes waiting to sync`
            : 'All changes are synced'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function SyncButton(): React.ReactElement {
  const { isOnline, isSyncing, pendingCount, sync } = useOffline();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => void sync()}
      disabled={!isOnline || isSyncing || pendingCount === 0}
      className="gap-2"
    >
      <RefreshCw className={cn('h-4 w-4', isSyncing && 'animate-spin')} />
      {isSyncing ? 'Syncing...' : `Sync${pendingCount > 0 ? ` (${pendingCount})` : ''}`}
    </Button>
  );
}

export function NetworkStatusBadge(): React.ReactElement {
  const { isOnline } = useOffline();

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-xs font-medium',
        isOnline ? 'text-green-600' : 'text-red-600'
      )}
    >
      <span
        className={cn(
          'h-2 w-2 rounded-full',
          isOnline ? 'bg-green-500' : 'bg-red-500'
        )}
      />
      {isOnline ? 'Online' : 'Offline'}
    </div>
  );
}
