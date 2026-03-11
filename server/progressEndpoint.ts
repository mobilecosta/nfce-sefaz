import { Request, Response } from 'express';
import { ProgressManager, ProgressEvent } from './progressManager';

/**
 * Middleware para autenticação de sessão SSE
 */
function authenticateSSERequest(req: Request): { userId: number; sessionId: string } | null {
  const sessionId = req.query.sessionId as string;
  const userId = req.query.userId as string;

  if (!sessionId || !userId) {
    return null;
  }

  return {
    sessionId,
    userId: parseInt(userId),
  };
}

/**
 * Endpoint SSE para streaming de progresso de download
 * GET /api/progress/stream?sessionId=xxx&userId=xxx
 */
export function setupProgressEndpoint(app: any) {
  app.get('/api/progress/stream', (req: Request, res: Response) => {
    const auth = authenticateSSERequest(req);

    if (!auth) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { sessionId, userId } = auth;
    const session = ProgressManager.getSession(sessionId);

    if (!session || session.userId !== userId) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // Configurar headers SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Accel-Buffering', 'no');

    // Enviar evento inicial com estado atual
    const currentEvent: ProgressEvent = {
      sessionId,
      type: 'start',
      totalFiles: session.totalFiles,
      completedFiles: session.completedFiles,
      failedFiles: session.failedFiles,
      totalSize: session.totalSize,
      processedSize: session.processedSize,
      percentage: Math.round((session.processedSize / session.totalSize) * 100),
      timestamp: Date.now(),
    };

    res.write(`data: ${JSON.stringify(currentEvent)}\n\n`);

    // Obter emitter da sessão
    const emitter = ProgressManager.getEmitter(sessionId);

    if (!emitter) {
      res.write(`data: ${JSON.stringify({
        type: 'error',
        errorMessage: 'Session emitter not found',
      })}\n\n`);
      res.end();
      return;
    }

    // Listener para eventos de progresso
    const progressListener = (event: ProgressEvent) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    // Adicionar listener
    emitter.on('progress', progressListener);

    // Enviar heartbeat a cada 30 segundos para manter conexão viva
    const heartbeatInterval = setInterval(() => {
      res.write(`:heartbeat\n\n`);
    }, 30000);

    // Limpar ao desconectar
    req.on('close', () => {
      clearInterval(heartbeatInterval);
      emitter.removeListener('progress', progressListener);
      ProgressManager.clearSession(sessionId);
    });

    // Timeout de 1 hora
    const timeout = setTimeout(() => {
      clearInterval(heartbeatInterval);
      emitter.removeListener('progress', progressListener);
      res.end();
    }, 60 * 60 * 1000);

    req.on('close', () => {
      clearTimeout(timeout);
    });
  });

  /**
   * Endpoint para obter status atual de uma sessão
   * GET /api/progress/status?sessionId=xxx&userId=xxx
   */
  app.get('/api/progress/status', (req: Request, res: Response) => {
    const auth = authenticateSSERequest(req);

    if (!auth) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { sessionId, userId } = auth;
    const session = ProgressManager.getSession(sessionId);

    if (!session || session.userId !== userId) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const percentage = Math.round((session.processedSize / session.totalSize) * 100);
    const elapsedTime = Date.now() - session.startTime;
    const estimatedTimeRemaining =
      session.processedSize > 0
        ? Math.round(
            (elapsedTime / session.processedSize) * (session.totalSize - session.processedSize)
          )
        : 0;

    res.json({
      sessionId,
      status: session.status,
      totalFiles: session.totalFiles,
      completedFiles: session.completedFiles,
      failedFiles: session.failedFiles,
      totalSize: session.totalSize,
      processedSize: session.processedSize,
      percentage,
      elapsedTime,
      estimatedTimeRemaining,
      currentFile: session.currentFile,
      errorMessage: session.errorMessage,
    });
  });

  /**
   * Endpoint para cancelar um download em lote
   * POST /api/progress/cancel
   */
  app.post('/api/progress/cancel', (req: Request, res: Response) => {
    const auth = authenticateSSERequest(req);

    if (!auth) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { sessionId, userId } = auth;
    const session = ProgressManager.getSession(sessionId);

    if (!session || session.userId !== userId) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    ProgressManager.errorSession(sessionId, 'Download cancelado pelo usuário');
    res.json({ success: true, message: 'Download cancelado' });
  });
}
