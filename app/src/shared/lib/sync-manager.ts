// Sync Manager - Processes queued operations when online
import {
  OfflineStorage,
  QueuedOperation,
  isOnline,
} from './offline-storage';
import {
  createBeban,
  updateBeban,
  deleteBeban,
  createBay,
  updateBay,
  deleteBay,
  createUnit,
  updateUnit,
  deleteUnit,
  createUnitCategory,
  updateUnitCategory,
  deleteUnitCategory,
  createUser,
  updateUser,
  deleteUser,
} from './api';

export type SyncStatus = 'idle' | 'syncing' | 'completed' | 'error';

export interface SyncResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: Array<{ operation: QueuedOperation; error: string }>;
}

export class SyncManager {
  private static instance: SyncManager;
  private status: SyncStatus = 'idle';
  private listeners: Set<(status: SyncStatus) => void> = new Set();
  private abortController: AbortController | null = null;

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  getStatus(): SyncStatus {
    return this.status;
  }

  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setStatus(status: SyncStatus): void {
    this.status = status;
    this.listeners.forEach(listener => listener(status));
  }

  async sync(token: string): Promise<SyncResult> {
    if (!isOnline()) {
      return {
        success: false,
        processed: 0,
        failed: 0,
        errors: [{ operation: {} as QueuedOperation, error: 'Device is offline' }],
      };
    }

    const queue = OfflineStorage.getQueue().filter(op => op.status === 'pending');
    
    if (queue.length === 0) {
      return { success: true, processed: 0, failed: 0, errors: [] };
    }

    this.setStatus('syncing');
    this.abortController = new AbortController();

    const result: SyncResult = {
      success: true,
      processed: 0,
      failed: 0,
      errors: [],
    };

    // Process operations sequentially to maintain order
    for (const operation of queue) {
      if (this.abortController.signal.aborted) {
        break;
      }

      try {
        OfflineStorage.updateOperation(operation.id, { status: 'syncing' });
        await this.executeOperation(operation, token);
        OfflineStorage.updateOperation(operation.id, { status: 'completed' });
        result.processed++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const retryCount = operation.retryCount + 1;
        
        if (retryCount >= 3) {
          // Mark as failed after 3 retries
          OfflineStorage.updateOperation(operation.id, { 
            status: 'failed', 
            error: errorMessage,
            retryCount,
          });
          result.failed++;
          result.errors.push({ operation, error: errorMessage });
        } else {
          // Keep as pending for retry
          OfflineStorage.updateOperation(operation.id, { 
            status: 'pending',
            retryCount,
            error: errorMessage,
          });
          result.failed++;
          result.errors.push({ operation, error: errorMessage });
        }
      }
    }

    this.abortController = null;
    this.setStatus(result.failed > 0 ? 'error' : 'completed');
    
    // Clear completed operations after a delay
    if (result.processed > 0) {
      setTimeout(() => OfflineStorage.clearCompleted(), 5000);
    }

    return result;
  }

  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.setStatus('idle');
    }
  }

  private async executeOperation(operation: QueuedOperation, token: string): Promise<void> {
    switch (operation.type) {
      case 'CREATE_BEBAN':
        await createBeban(token, operation.payload as Parameters<typeof createBeban>[1]);
        break;
      case 'UPDATE_BEBAN':
        await updateBeban(token, operation.payload as Parameters<typeof updateBeban>[1]);
        break;
      case 'DELETE_BEBAN':
        await deleteBeban(token, operation.payload as number);
        break;
      case 'CREATE_BAY':
        await createBay(token, operation.payload as Parameters<typeof createBay>[1]);
        break;
      case 'UPDATE_BAY':
        await updateBay(token, operation.payload as Parameters<typeof updateBay>[1]);
        break;
      case 'DELETE_BAY':
        await deleteBay(token, operation.payload as number);
        break;
      case 'CREATE_UNIT':
        await createUnit(token, operation.payload as Parameters<typeof createUnit>[1]);
        break;
      case 'UPDATE_UNIT':
        await updateUnit(token, operation.payload as Parameters<typeof updateUnit>[1]);
        break;
      case 'DELETE_UNIT':
        await deleteUnit(token, operation.payload as number);
        break;
      case 'CREATE_UNIT_CATEGORY':
        await createUnitCategory(token, operation.payload as Parameters<typeof createUnitCategory>[1]);
        break;
      case 'UPDATE_UNIT_CATEGORY':
        await updateUnitCategory(token, operation.payload as Parameters<typeof updateUnitCategory>[1]);
        break;
      case 'DELETE_UNIT_CATEGORY':
        await deleteUnitCategory(token, operation.payload as number);
        break;
      case 'CREATE_USER':
        await createUser(token, operation.payload as Parameters<typeof createUser>[1]);
        break;
      case 'UPDATE_USER':
        await updateUser(token, operation.payload as Parameters<typeof updateUser>[1]);
        break;
      case 'DELETE_USER':
        await deleteUser(token, operation.payload as number);
        break;
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }
}

// Auto-sync when coming back online
export function setupAutoSync(token: string | null): () => void {
  if (typeof window === 'undefined') return () => {};

  const syncManager = SyncManager.getInstance();

  const handleOnline = () => {
    if (token && OfflineStorage.getPendingCount() > 0) {
      syncManager.sync(token).catch(console.error);
    }
  };

  window.addEventListener('online', handleOnline);
  
  // Also check periodically when online (every 30 seconds)
  const interval = setInterval(() => {
    if (token && isOnline() && OfflineStorage.getPendingCount() > 0 && syncManager.getStatus() === 'idle') {
      syncManager.sync(token).catch(console.error);
    }
  }, 30000);

  return () => {
    window.removeEventListener('online', handleOnline);
    clearInterval(interval);
  };
}
