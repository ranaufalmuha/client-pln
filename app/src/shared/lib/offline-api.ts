// Offline-aware API wrapper
// These functions queue operations when offline and execute immediately when online

import { toast } from 'sonner';
import {
  OfflineStorage,
  QueuedOperationType,
  isOnline,
} from './offline-storage';
import {
  createBeban as apiCreateBeban,
  updateBeban as apiUpdateBeban,
  deleteBeban as apiDeleteBeban,
  createBay as apiCreateBay,
  updateBay as apiUpdateBay,
  deleteBay as apiDeleteBay,
  createUnit as apiCreateUnit,
  updateUnit as apiUpdateUnit,
  deleteUnit as apiDeleteUnit,
  createUnitCategory as apiCreateUnitCategory,
  updateUnitCategory as apiUpdateUnitCategory,
  deleteUnitCategory as apiDeleteUnitCategory,
  createUser as apiCreateUser,
  updateUser as apiUpdateUser,
  deleteUser as apiDeleteUser,
  type CreateBebanInput,
  type UpdateBebanInput,
  type CreateBayInput,
  type UpdateBayInput,
  type CreateUnitInput,
  type UpdateUnitInput,
  type CreateUnitCategoryInput,
  type UpdateUnitCategoryInput,
  type AdminCreateUserInput,
  type AdminUpdateUserInput,
  type Beban,
  type Bay,
  type Unit,
  type UnitCategory,
  type AuthUser,
} from './api';
import { SyncManager } from './sync-manager';

// Helper to handle offline/online logic
async function handleOperation<T>(
  _token: string,
  type: QueuedOperationType,
  payload: unknown,
  apiCall: () => Promise<T>,
  successMessage: string,
  offlineMessage: string
): Promise<T> {
  if (isOnline()) {
    try {
      const result = await apiCall();
      toast.success(successMessage);
      return result;
    } catch (error) {
      // If API fails, queue for retry
      OfflineStorage.addToQueue({ type, payload });
      toast.error('Operation failed. Queued for retry.');
      throw error;
    }
  } else {
    // Offline - queue the operation
    OfflineStorage.addToQueue({ type, payload });
    toast.info(offlineMessage);
    
    // Return a mock response for immediate UI update
    return createMockResponse(type, payload) as T;
  }
}

// Create mock responses for offline operations
function createMockResponse(type: QueuedOperationType, payload: unknown): unknown {
  const now = new Date().toISOString();
  
  switch (type) {
    case 'CREATE_BEBAN':
      return {
        id: -Date.now(), // Temporary negative ID
        ...(payload as CreateBebanInput),
        measuredAt: (payload as CreateBebanInput).measuredAt || now,
      } as Beban;
    case 'UPDATE_BEBAN':
      return {
        ...(payload as UpdateBebanInput),
      } as Beban;
    case 'CREATE_BAY':
      return {
        id: -Date.now(),
        ...(payload as CreateBayInput),
        unitName: '',
        unitCategoryId: 0,
        unitCategoryKey: '',
        unitCategoryName: '',
      } as Bay;
    case 'UPDATE_BAY':
      return {
        ...(payload as UpdateBayInput),
      } as Bay;
    case 'CREATE_UNIT':
      return {
        id: -Date.now(),
        ...(payload as CreateUnitInput),
        categoryKey: '',
        categoryName: '',
      } as Unit;
    case 'UPDATE_UNIT':
      return {
        ...(payload as UpdateUnitInput),
      } as Unit;
    case 'CREATE_UNIT_CATEGORY':
      return {
        id: -Date.now(),
        ...(payload as CreateUnitCategoryInput),
      } as UnitCategory;
    case 'UPDATE_UNIT_CATEGORY':
      return {
        ...(payload as UpdateUnitCategoryInput),
      } as UnitCategory;
    case 'CREATE_USER':
      return {
        id: -Date.now(),
        ...(payload as AdminCreateUserInput),
      } as AuthUser;
    case 'UPDATE_USER':
      return {
        ...(payload as AdminUpdateUserInput),
      } as AuthUser;
    default:
      return payload;
  }
}

// Offline-aware API functions
export async function createBebanOffline(
  token: string,
  input: CreateBebanInput
): Promise<Beban> {
  return handleOperation(
    token,
    'CREATE_BEBAN',
    input,
    () => apiCreateBeban(token, input),
    'Beban created successfully',
    'Beban saved offline. Will sync when online.'
  );
}

export async function updateBebanOffline(
  token: string,
  input: UpdateBebanInput
): Promise<Beban> {
  return handleOperation(
    token,
    'UPDATE_BEBAN',
    input,
    () => apiUpdateBeban(token, input),
    'Beban updated successfully',
    'Beban update saved offline. Will sync when online.'
  );
}

export async function deleteBebanOffline(
  token: string,
  id: number
): Promise<boolean> {
  return handleOperation(
    token,
    'DELETE_BEBAN',
    id,
    () => apiDeleteBeban(token, id),
    'Beban deleted successfully',
    'Beban delete saved offline. Will sync when online.'
  );
}

export async function createBayOffline(
  token: string,
  input: CreateBayInput
): Promise<Bay> {
  return handleOperation(
    token,
    'CREATE_BAY',
    input,
    () => apiCreateBay(token, input),
    'Bay created successfully',
    'Bay saved offline. Will sync when online.'
  );
}

export async function updateBayOffline(
  token: string,
  input: UpdateBayInput
): Promise<Bay> {
  return handleOperation(
    token,
    'UPDATE_BAY',
    input,
    () => apiUpdateBay(token, input),
    'Bay updated successfully',
    'Bay update saved offline. Will sync when online.'
  );
}

export async function deleteBayOffline(
  token: string,
  id: number
): Promise<boolean> {
  return handleOperation(
    token,
    'DELETE_BAY',
    id,
    () => apiDeleteBay(token, id),
    'Bay deleted successfully',
    'Bay delete saved offline. Will sync when online.'
  );
}

export async function createUnitOffline(
  token: string,
  input: CreateUnitInput
): Promise<Unit> {
  return handleOperation(
    token,
    'CREATE_UNIT',
    input,
    () => apiCreateUnit(token, input),
    'Unit created successfully',
    'Unit saved offline. Will sync when online.'
  );
}

export async function updateUnitOffline(
  token: string,
  input: UpdateUnitInput
): Promise<Unit> {
  return handleOperation(
    token,
    'UPDATE_UNIT',
    input,
    () => apiUpdateUnit(token, input),
    'Unit updated successfully',
    'Unit update saved offline. Will sync when online.'
  );
}

export async function deleteUnitOffline(
  token: string,
  id: number
): Promise<boolean> {
  return handleOperation(
    token,
    'DELETE_UNIT',
    id,
    () => apiDeleteUnit(token, id),
    'Unit deleted successfully',
    'Unit delete saved offline. Will sync when online.'
  );
}

export async function createUnitCategoryOffline(
  token: string,
  input: CreateUnitCategoryInput
): Promise<UnitCategory> {
  return handleOperation(
    token,
    'CREATE_UNIT_CATEGORY',
    input,
    () => apiCreateUnitCategory(token, input),
    'Category created successfully',
    'Category saved offline. Will sync when online.'
  );
}

export async function updateUnitCategoryOffline(
  token: string,
  input: UpdateUnitCategoryInput
): Promise<UnitCategory> {
  return handleOperation(
    token,
    'UPDATE_UNIT_CATEGORY',
    input,
    () => apiUpdateUnitCategory(token, input),
    'Category updated successfully',
    'Category update saved offline. Will sync when online.'
  );
}

export async function deleteUnitCategoryOffline(
  token: string,
  id: number
): Promise<boolean> {
  return handleOperation(
    token,
    'DELETE_UNIT_CATEGORY',
    id,
    () => apiDeleteUnitCategory(token, id),
    'Category deleted successfully',
    'Category delete saved offline. Will sync when online.'
  );
}

export async function createUserOffline(
  token: string,
  input: AdminCreateUserInput
): Promise<AuthUser> {
  return handleOperation(
    token,
    'CREATE_USER',
    input,
    () => apiCreateUser(token, input),
    'User created successfully',
    'User saved offline. Will sync when online.'
  );
}

export async function updateUserOffline(
  token: string,
  input: AdminUpdateUserInput
): Promise<AuthUser> {
  return handleOperation(
    token,
    'UPDATE_USER',
    input,
    () => apiUpdateUser(token, input),
    'User updated successfully',
    'User update saved offline. Will sync when online.'
  );
}

export async function deleteUserOffline(
  token: string,
  id: number
): Promise<boolean> {
  return handleOperation(
    token,
    'DELETE_USER',
    id,
    () => apiDeleteUser(token, id),
    'User deleted successfully',
    'User delete saved offline. Will sync when online.'
  );
}

// Trigger manual sync
export async function triggerSync(token: string): Promise<void> {
  if (!isOnline()) {
    toast.error('Cannot sync while offline');
    return;
  }
  
  const result = await SyncManager.getInstance().sync(token);
  
  if (result.processed > 0 && result.failed === 0) {
    toast.success(`Synced ${result.processed} operations`);
  } else if (result.processed > 0 && result.failed > 0) {
    toast.warning(`Synced ${result.processed} operations, ${result.failed} failed`);
  } else if (result.failed > 0) {
    toast.error(`Failed to sync ${result.failed} operations`);
  } else {
    toast.info('Nothing to sync');
  }
}
