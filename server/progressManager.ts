import { EventEmitter } from 'events';

/**
 * Interface para eventos de progresso
 */
export interface ProgressEvent {
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

/**
 * Interface para estado de sessão
 */
interface ProgressSession {
  sessionId: string;
  userId: number;
  queryId: number;
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  totalSize: number;
  processedSize: number;
  currentFile?: string;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  startTime: number;
  errorMessage?: string;
  emitter: EventEmitter;
}

/**
 * Gerenciador de progresso de downloads em lote
 * Utiliza EventEmitter para notificar clientes em tempo real
 */
export class ProgressManager {
  private static sessions = new Map<string, ProgressSession>();
  private static sessionTimeout = 30 * 60 * 1000; // 30 minutos

  /**
   * Cria uma nova sessão de progresso
   */
  static createSession(
    sessionId: string,
    userId: number,
    queryId: number,
    totalFiles: number,
    totalSize: number
  ): ProgressSession {
    const session: ProgressSession = {
      sessionId,
      userId,
      queryId,
      totalFiles,
      completedFiles: 0,
      failedFiles: 0,
      totalSize,
      processedSize: 0,
      status: 'pending',
      startTime: Date.now(),
      emitter: new EventEmitter(),
    };

    this.sessions.set(sessionId, session);

    // Limpar sessão após timeout
    setTimeout(() => {
      this.sessions.delete(sessionId);
    }, this.sessionTimeout);

    return session;
  }

  /**
   * Obtém uma sessão existente
   */
  static getSession(sessionId: string): ProgressSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Atualiza o progresso de uma sessão
   */
  static updateProgress(
    sessionId: string,
    completedFiles: number,
    failedFiles: number,
    processedSize: number,
    currentFile?: string
  ): ProgressEvent | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.completedFiles = completedFiles;
    session.failedFiles = failedFiles;
    session.processedSize = processedSize;
    session.currentFile = currentFile;

    const percentage = Math.round((processedSize / session.totalSize) * 100);
    const elapsedTime = Date.now() - session.startTime;
    const estimatedTimeRemaining =
      processedSize > 0
        ? Math.round((elapsedTime / processedSize) * (session.totalSize - processedSize))
        : 0;

    const event: ProgressEvent = {
      sessionId,
      type: 'progress',
      totalFiles: session.totalFiles,
      completedFiles,
      failedFiles,
      currentFile,
      totalSize: session.totalSize,
      processedSize,
      percentage,
      estimatedTimeRemaining,
      timestamp: Date.now(),
    };

    // Emitir evento para todos os listeners
    session.emitter.emit('progress', event);

    return event;
  }

  /**
   * Marca um arquivo como completado
   */
  static completeFile(
    sessionId: string,
    fileSize: number,
    currentFile?: string
  ): ProgressEvent | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.completedFiles++;
    session.processedSize += fileSize;
    session.currentFile = currentFile;

    const percentage = Math.round((session.processedSize / session.totalSize) * 100);
    const elapsedTime = Date.now() - session.startTime;
    const estimatedTimeRemaining =
      session.processedSize > 0
        ? Math.round(
            (elapsedTime / session.processedSize) * (session.totalSize - session.processedSize)
          )
        : 0;

    const event: ProgressEvent = {
      sessionId,
      type: 'file_completed',
      totalFiles: session.totalFiles,
      completedFiles: session.completedFiles,
      failedFiles: session.failedFiles,
      currentFile,
      currentFileSize: fileSize,
      totalSize: session.totalSize,
      processedSize: session.processedSize,
      percentage,
      estimatedTimeRemaining,
      timestamp: Date.now(),
    };

    session.emitter.emit('progress', event);

    return event;
  }

  /**
   * Marca um arquivo como falhado
   */
  static failFile(sessionId: string, errorMessage?: string): ProgressEvent | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.failedFiles++;

    const percentage = Math.round((session.processedSize / session.totalSize) * 100);

    const event: ProgressEvent = {
      sessionId,
      type: 'progress',
      totalFiles: session.totalFiles,
      completedFiles: session.completedFiles,
      failedFiles: session.failedFiles,
      totalSize: session.totalSize,
      processedSize: session.processedSize,
      percentage,
      timestamp: Date.now(),
    };

    session.emitter.emit('progress', event);

    return event;
  }

  /**
   * Marca a sessão como completada
   */
  static completeSession(sessionId: string): ProgressEvent | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.status = 'completed';

    const event: ProgressEvent = {
      sessionId,
      type: 'completed',
      totalFiles: session.totalFiles,
      completedFiles: session.completedFiles,
      failedFiles: session.failedFiles,
      totalSize: session.totalSize,
      processedSize: session.processedSize,
      percentage: 100,
      timestamp: Date.now(),
    };

    session.emitter.emit('progress', event);

    // Limpar sessão após 5 segundos
    setTimeout(() => {
      this.sessions.delete(sessionId);
    }, 5000);

    return event;
  }

  /**
   * Marca a sessão como erro
   */
  static errorSession(sessionId: string, errorMessage: string): ProgressEvent | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.status = 'error';
    session.errorMessage = errorMessage;

    const event: ProgressEvent = {
      sessionId,
      type: 'error',
      totalFiles: session.totalFiles,
      completedFiles: session.completedFiles,
      failedFiles: session.failedFiles,
      totalSize: session.totalSize,
      processedSize: session.processedSize,
      percentage: Math.round((session.processedSize / session.totalSize) * 100),
      errorMessage,
      timestamp: Date.now(),
    };

    session.emitter.emit('progress', event);

    // Limpar sessão após 5 segundos
    setTimeout(() => {
      this.sessions.delete(sessionId);
    }, 5000);

    return event;
  }

  /**
   * Obtém o EventEmitter de uma sessão para subscribe
   */
  static getEmitter(sessionId: string): EventEmitter | null {
    const session = this.sessions.get(sessionId);
    return session?.emitter || null;
  }

  /**
   * Limpa uma sessão manualmente
   */
  static clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /**
   * Obtém estatísticas de todas as sessões ativas
   */
  static getActiveSessionsCount(): number {
    return this.sessions.size;
  }
}
