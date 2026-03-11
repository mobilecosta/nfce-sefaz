import { ProgressData } from '@/hooks/useDownloadProgress';
import { AlertCircle, CheckCircle, Loader2, XCircle } from 'lucide-react';

interface DownloadProgressBarProps {
  progress: ProgressData | null;
  isConnected: boolean;
  error?: string | null;
  onCancel?: () => void;
}

/**
 * Componente de barra de progresso para download em lote
 */
export function DownloadProgressBar({
  progress,
  isConnected,
  error,
  onCancel,
}: DownloadProgressBarProps) {
  if (!progress) {
    return null;
  }

  const percentage = progress.percentage || 0;
  const isCompleted = progress.type === 'completed';
  const isFailed = progress.type === 'error';
  const isDownloading = progress.type === 'progress' || progress.type === 'file_completed';

  // Formatar tamanho em bytes para formato legível
  const formatSize = (bytes: number | undefined): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Formatar tempo em minutos e segundos
  const formatTime = (ms: number | undefined): string => {
    if (!ms || ms < 0) return '—';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="card-brutal space-y-6 bg-foreground text-background">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isCompleted && <CheckCircle className="w-6 h-6 text-green-500" />}
          {isFailed && <XCircle className="w-6 h-6 text-red-500" />}
          {isDownloading && <Loader2 className="w-6 h-6 animate-spin" />}
          {!isDownloading && !isCompleted && !isFailed && (
            <AlertCircle className="w-6 h-6" />
          )}
          <h3 className="text-xl font-black">
            {isCompleted && 'DOWNLOAD CONCLUÍDO'}
            {isFailed && 'ERRO NO DOWNLOAD'}
            {isDownloading && 'BAIXANDO ARQUIVOS'}
            {!isDownloading && !isCompleted && !isFailed && 'PREPARANDO...'}
          </h3>
        </div>
        {isDownloading && onCancel && (
          <button
            onClick={onCancel}
            className="text-sm font-bold px-4 py-2 border-2 border-background hover:bg-background hover:text-foreground transition-colors"
          >
            CANCELAR
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="w-full h-8 border-2 border-background bg-background/20 overflow-hidden">
          <div
            className="h-full bg-background transition-all duration-300 flex items-center justify-center"
            style={{ width: `${percentage}%` }}
          >
            {percentage > 10 && (
              <span className="text-xs font-black text-foreground">{percentage}%</span>
            )}
          </div>
        </div>
        <div className="text-right text-sm font-bold">{percentage}%</div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="space-y-1">
          <p className="text-xs opacity-75">ARQUIVOS</p>
          <p className="font-mono font-bold">
            {progress.completedFiles}/{progress.totalFiles}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-xs opacity-75">TAMANHO</p>
          <p className="font-mono font-bold">
            {formatSize(progress.processedSize || 0)}/{formatSize(progress.totalSize || 0)}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-xs opacity-75">FALHADOS</p>
          <p className={`font-mono font-bold ${progress.failedFiles > 0 ? 'text-red-400' : ''}`}>
            {progress.failedFiles}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-xs opacity-75">TEMPO RESTANTE</p>
          <p className="font-mono font-bold">
            {formatTime(progress.estimatedTimeRemaining)}
          </p>
        </div>
      </div>

      {/* Current File */}
      {progress.currentFile && isDownloading && (
        <div className="space-y-2 border-t-2 border-background pt-4">
          <p className="text-xs opacity-75">ARQUIVO ATUAL</p>
          <p className="font-mono text-sm truncate">{progress.currentFile}</p>
          {progress.currentFileSize && progress.currentFileSize > 0 && (
            <p className="text-xs opacity-75">
              Tamanho: {formatSize(progress.currentFileSize)}
            </p>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="space-y-2 border-t-2 border-background pt-4 bg-red-900/20 p-3">
          <p className="text-xs font-bold text-red-300">ERRO</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {progress.errorMessage && (
        <div className="space-y-2 border-t-2 border-background pt-4 bg-red-900/20 p-3">
          <p className="text-xs font-bold text-red-300">ERRO</p>
          <p className="text-sm">{progress.errorMessage}</p>
        </div>
      )}

      {/* Connection Status */}
      {!isConnected && !isCompleted && !isFailed && (
        <div className="text-xs opacity-75 text-center">
          Reconectando...
        </div>
      )}

      {/* Completion Message */}
      {isCompleted && (
        <div className="border-t-2 border-background pt-4 space-y-2">
          <p className="text-sm">
            {progress.failedFiles === 0
              ? 'Todos os arquivos foram baixados com sucesso!'
              : `Download concluído com ${progress.failedFiles} erro(s).`}
          </p>
        </div>
      )}
    </div>
  );
}
