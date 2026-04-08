// Offline storage service for queueing operations when offline
// Uses localStorage for persistence

export type QueuedOperationType = 
  | 'CREATE_BEBAN'
  | 'UPDATE_BEBAN'
  | 'DELETE_BEBAN'
  | 'CREATE_BAY'
  | 'UPDATE_BAY'
  | 'DELETE_BAY'
  | 'CREATE_UNIT'
  | 'UPDATE_UNIT'
  | 'DELETE_UNIT'
  | 'CREATE_UNIT_CATEGORY'
  | 'UPDATE_UNIT_CATEGORY'
  | 'DELETE_UNIT_CATEGORY'
  | 'CREATE_USER'
  | 'UPDATE_USER'
  | 'DELETE_USER';

export type OperationStatus = 'pending' | 'syncing' | 'completed' | 'failed';

export interface QueuedOperation {
  id: string;
  type: QueuedOperationType;
  payload: unknown;
  status: OperationStatus;
  retryCount: number;
  createdAt: string;
  error?: string;
}

const QUEUE_KEY = 'pln-client:offline-queue';
const OFFLINE_DATA_KEY = 'pln-client:offline-data';

export class OfflineStorage {
  // Queue Management
  static getQueue(): QueuedOperation[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveQueue(queue: QueuedOperation[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }

  static addToQueue(operation: Omit<QueuedOperation, 'id' | 'createdAt' | 'status' | 'retryCount'>): QueuedOperation {
    const queue = this.getQueue();
    const newOperation: QueuedOperation = {
      ...operation,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };
    queue.push(newOperation);
    this.saveQueue(queue);
    return newOperation;
  }

  static updateOperation(id: string, updates: Partial<QueuedOperation>): void {
    const queue = this.getQueue();
    const index = queue.findIndex(op => op.id === id);
    if (index !== -1) {
      queue[index] = { ...queue[index], ...updates };
      this.saveQueue(queue);
    }
  }

  static removeFromQueue(id: string): void {
    const queue = this.getQueue();
    const filtered = queue.filter(op => op.id !== id);
    this.saveQueue(filtered);
  }

  static clearCompleted(): void {
    const queue = this.getQueue();
    const pending = queue.filter(op => op.status !== 'completed');
    this.saveQueue(pending);
  }

  static getPendingCount(): number {
    return this.getQueue().filter(op => op.status === 'pending').length;
  }

  static getFailedCount(): number {
    return this.getQueue().filter(op => op.status === 'failed').length;
  }

  // Offline Data Cache
  static getCachedData<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(`${OFFLINE_DATA_KEY}:${key}`);
      if (!data) return null;
      const parsed = JSON.parse(data);
      // Check if cache is expired (24 hours)
      if (parsed.timestamp && Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(`${OFFLINE_DATA_KEY}:${key}`);
        return null;
      }
      return parsed.data;
    } catch {
      return null;
    }
  }

  static setCachedData<T>(key: string, data: T): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`${OFFLINE_DATA_KEY}:${key}`, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  }

  static clearCachedData(key?: string): void {
    if (typeof window === 'undefined') return;
    if (key) {
      localStorage.removeItem(`${OFFLINE_DATA_KEY}:${key}`);
    } else {
      // Clear all cached data
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k?.startsWith(OFFLINE_DATA_KEY)) {
          localStorage.removeItem(k);
        }
      }
    }
  }

  // Cache keys
  static readonly CACHE_KEYS = {
    USERS: 'users',
    UNITS: 'units',
    UNIT_CATEGORIES: 'unit-categories',
    BAYS: 'bays',
    BEBANS: 'bebans',
    CURRENT_USER: 'current-user',
  } as const;
}

// Helper to generate operation IDs
export function generateOperationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Check if device is online
export function isOnline(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}
