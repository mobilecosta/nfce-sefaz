import { useEffect, useState, useCallback, useRef } from 'react';

export interface ProgressData {
  sessionId: string;
  type: 'start' | 'progress' | 'file_completed' | 'completed' | 'error';
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  currentFile?: string;
  currentFileSize?: number;
  totalSize: number;
  processedSize: number;
  percentage: number;
  estimatedTimeRemaining?: number;
  errorMessage?: string;
  timestamp: number;
}

interface UseDownloadProgressOptions {
  sessionId: string;
  userId: number;
  enabled?: boolean;
}

/**
 * Hook para consumir progresso de download via SSE
 */
export function useDownloadProgress({
  sessionId,
  userId,
  enabled = true,
}: UseDownloadProgressOptions) {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!enabled || !sessionId || !userId) {
      return;
    }

    try {
      const url = `/api/progress/stream?sessionId=${encodeURIComponent(
        sessionId
      )}&userId=${userId}`;

      const eventSource = new EventSource(url);

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
      };

      eventSource.onmessage = (event) => {
        try {
          // Ignorar heartbeats
          if (event.data === ':heartbeat') {
            return;
          }

          const data = JSON.parse(event.data) as ProgressData;
          setProgress(data);

          // Fechar conexão quando completado ou erro
          if (data.type === 'completed' || data.type === 'error') {
            eventSource.close();
            setIsConnected(false);
          }
        } catch (err) {
          console.error('[useDownloadProgress] Erro ao parsear evento:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('[useDownloadProgress] Erro SSE:', err);
        setError('Conexão perdida');
        setIsConnected(false);
        eventSource.close();
      };

      eventSourceRef.current = eventSource;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao conectar';
      setError(message);
      console.error('[useDownloadProgress] Erro:', err);
    }
  }, [sessionId, userId, enabled]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const cancel = useCallback(async () => {
    try {
      const response = await fetch('/api/progress/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId, userId }),
      });

      if (!response.ok) {
        throw new Error('Erro ao cancelar download');
      }

      disconnect();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao cancelar';
      setError(message);
    }
  }, [sessionId, userId, disconnect]);

  useEffect(() => {
    if (enabled && sessionId && userId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, sessionId, userId, connect, disconnect]);

  return {
    progress,
    isConnected,
    error,
    cancel,
    disconnect,
  };
}
