// Sync status page - shows pending operations and sync status
'use client';

import * as React from 'react';
import { 
  RefreshCw, 
  Trash2, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  WifiOff,
  Database
} from 'lucide-react';
import { useOffline } from '@/shared/lib/offline-hooks';
import { useAppRouter } from '@/shared/lib/app-router';
import { DashboardShell } from '@/shared/components/dashboard-shell';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Separator } from '@/shared/components/ui/separator';
import { cn } from '@/shared/lib/utils';

function formatOperationType(type: string): string {
  return type
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'syncing':
      return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'failed':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return null;
  }
}

function getStatusBadge(status: string) {
  const variants: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    syncing: 'bg-blue-100 text-blue-800 border-blue-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    failed: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <Badge variant="outline" className={cn('capitalize', variants[status] || '')}>
      {status}
    </Badge>
  );
}

export default function SyncPage(): React.ReactElement {
  const { navigate } = useAppRouter();
  const {
    isOnline,
    syncStatus,
    isSyncing,
    pendingCount,
    failedCount,
    pendingOperations,
    sync,
    retryFailed,
    clearCompleted,
    removeOperation,
  } = useOffline();

  return (
    <DashboardShell title="Sync Status">
      <div className="space-y-6 px-4 lg:px-6">
        {/* Status Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Connection Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <>
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <span className="text-lg font-semibold">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-5 w-5 text-red-500" />
                    <span className="text-lg font-semibold text-red-600">Offline</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Operations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <span className="text-2xl font-bold">{pendingCount}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Failed Operations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertCircle className={cn('h-5 w-5', failedCount > 0 ? 'text-red-500' : 'text-gray-400')} />
                <span className={cn('text-2xl font-bold', failedCount > 0 && 'text-red-600')}>
                  {failedCount}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sync Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {isSyncing ? (
                  <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
                ) : (
                  <Database className="h-5 w-5 text-gray-500" />
                )}
                <span className="text-lg font-semibold capitalize">{syncStatus}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => void sync()}
            disabled={!isOnline || isSyncing || pendingCount === 0}
            className="gap-2"
          >
            <RefreshCw className={cn('h-4 w-4', isSyncing && 'animate-spin')} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>

          <Button
            variant="outline"
            onClick={retryFailed}
            disabled={failedCount === 0 || isSyncing}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Retry Failed
          </Button>

          <Button
            variant="outline"
            onClick={clearCompleted}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Clear Completed
          </Button>

          <Button variant="outline" onClick={() => navigate('/admin')}>
            Back to Admin
          </Button>
        </div>

        {/* Operations List */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Operations</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingOperations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p className="text-lg font-medium">All caught up!</p>
                <p>No pending operations to sync.</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {pendingOperations.map((operation, index) => (
                    <React.Fragment key={operation.id}>
                      {index > 0 && <Separator className="my-2" />}
                      <div className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(operation.status)}
                            <span className="font-medium">
                              {formatOperationType(operation.type)}
                            </span>
                            {getStatusBadge(operation.status)}
                            {operation.retryCount > 0 && (
                              <Badge variant="outline" className="text-xs">
                                Retry: {operation.retryCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Created: {new Date(operation.createdAt).toLocaleString()}
                          </p>
                          {operation.error && (
                            <p className="text-xs text-red-600 bg-red-50 p-2 rounded mt-1">
                              Error: {operation.error}
                            </p>
                          )}
                          <details className="text-xs">
                            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                              View payload
                            </summary>
                            <pre className="mt-1 p-2 bg-black/5 rounded text-[10px] overflow-auto">
                              {JSON.stringify(operation.payload, null, 2)}
                            </pre>
                          </details>
                        </div>
                        <div className="flex gap-1">
                          {operation.status === 'failed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                removeOperation(operation.id);
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <h3 className="font-medium mb-2">How Offline Mode Works</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>When offline, all changes are saved locally in your browser</li>
              <li>Changes are automatically synced when you come back online</li>
              <li>Failed operations can be retried manually</li>
              <li>Data is stored securely in localStorage and persists across sessions</li>
              <li>Maximum of 3 retry attempts before marking as failed</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
