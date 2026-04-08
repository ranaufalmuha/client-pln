// React hooks and context for offline functionality
'use client';

import * as React from 'react';
import { OfflineStorage, isOnline as checkIsOnline, QueuedOperation } from './offline-storage';
import { SyncManager, SyncStatus, setupAutoSync } from './sync-manager';

// Network status hook
export function useNetworkStatus(): { isOnline: boolean; isOffline: boolean } {
  const [online, setOnline] = React.useState(checkIsOnline());

  React.useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline: online, isOffline: !online };
}

// Sync status hook
export function useSyncStatus(): { status: SyncStatus; isSyncing: boolean } {
  const [status, setStatus] = React.useState<SyncStatus>(SyncManager.getInstance().getStatus());

  React.useEffect(() => {
    return SyncManager.getInstance().subscribe(setStatus);
  }, []);

  return { status, isSyncing: status === 'syncing' };
}

// Pending operations hook
export function usePendingOperations(): {
  pendingCount: number;
  failedCount: number;
  pendingOperations: QueuedOperation[];
  refresh: () => void;
} {
  const [count, setCount] = React.useState(0);
  const [failed, setFailed] = React.useState(0);
  const [operations, setOperations] = React.useState<QueuedOperation[]>([]);

  const refresh = React.useCallback(() => {
    setCount(OfflineStorage.getPendingCount());
    setFailed(OfflineStorage.getFailedCount());
    setOperations(OfflineStorage.getQueue());
  }, []);

  React.useEffect(() => {
    refresh();
    
    // Refresh every 2 seconds to stay updated
    const interval = setInterval(refresh, 2000);
    return () => clearInterval(interval);
  }, [refresh]);

  return {
    pendingCount: count,
    failedCount: failed,
    pendingOperations: operations,
    refresh,
  };
}

// Offline context
interface OfflineContextType {
  isOnline: boolean;
  isOffline: boolean;
  syncStatus: SyncStatus;
  isSyncing: boolean;
  pendingCount: number;
  failedCount: number;
  pendingOperations: QueuedOperation[];
  sync: () => Promise<void>;
  refreshPending: () => void;
  retryFailed: () => void;
  clearCompleted: () => void;
  removeOperation: (id: string) => void;
}

const OfflineContext = React.createContext<OfflineContextType | null>(null);

export function useOffline(): OfflineContextType {
  const context = React.useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within OfflineProvider');
  }
  return context;
}

interface OfflineProviderProps {
  children: React.ReactNode;
  token: string | null;
}

export function OfflineProvider({ children, token }: OfflineProviderProps): React.ReactElement {
  const { isOnline, isOffline } = useNetworkStatus();
  const { status: syncStatus, isSyncing } = useSyncStatus();
  const { pendingCount, failedCount, pendingOperations, refresh } = usePendingOperations();

  // Setup auto-sync
  React.useEffect(() => {
    if (!token) return;
    return setupAutoSync(token);
  }, [token]);

  const sync = React.useCallback(async () => {
    if (!token) return;
    try {
      await SyncManager.getInstance().sync(token);
    } finally {
      refresh();
    }
  }, [token, refresh]);

  const retryFailed = React.useCallback(() => {
    const queue = OfflineStorage.getQueue();
    queue.forEach(op => {
      if (op.status === 'failed') {
        OfflineStorage.updateOperation(op.id, { status: 'pending', retryCount: 0 });
      }
    });
    refresh();
    if (token && isOnline) {
      sync();
    }
  }, [token, isOnline, sync, refresh]);

  const clearCompleted = React.useCallback(() => {
    OfflineStorage.clearCompleted();
    refresh();
  }, [refresh]);

  const removeOperation = React.useCallback((id: string) => {
    OfflineStorage.removeFromQueue(id);
    refresh();
  }, [refresh]);

  const value = React.useMemo(
    () => ({
      isOnline,
      isOffline,
      syncStatus,
      isSyncing,
      pendingCount,
      failedCount,
      pendingOperations,
      sync,
      refreshPending: refresh,
      retryFailed,
      clearCompleted,
      removeOperation,
    }),
    [
      isOnline,
      isOffline,
      syncStatus,
      isSyncing,
      pendingCount,
      failedCount,
      pendingOperations,
      sync,
      refresh,
      retryFailed,
      clearCompleted,
      removeOperation,
    ]
  );

  return React.createElement(
    OfflineContext.Provider,
    { value },
    children
  );
}
