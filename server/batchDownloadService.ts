import archiver from 'archiver';
import { Readable, PassThrough } from 'stream';
import * as db from './db';

interface BatchDownloadParams {
  accessKeyIds: number[];
  queryId: number;
  userId: number;
}

interface DownloadProgress {
  totalItems: number;
  completedItems: number;
  failedItems: number;
  currentFile: string;
  status: 'pending' | 'downloading' | 'compressing' | 'completed' | 'error';
  errorMessage?: string;
}

/**
 * Serviço para gerenciar downloads em lote de XMLs de NFC-e
 */
export class BatchDownloadService {
  /**
   * Cria um arquivo ZIP com múltiplos XMLs de NFC-e
   */
  static async createBatchZip(params: BatchDownloadParams): Promise<{
    stream: PassThrough;
    fileName: string;
    totalFiles: number;
  }> {
    const { accessKeyIds, queryId, userId } = params;

    // Validar que o usuário tem acesso à consulta
    const query = await db.getNfceQueryById(queryId);
    if (!query || query.userId !== userId) {
      throw new Error('Acesso negado à consulta');
    }

    // Validar que existem chaves para download
    if (accessKeyIds.length === 0) {
      throw new Error('Nenhuma chave de acesso selecionada');
    }

    // Gerar nome do arquivo ZIP
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `nfce-${query.cnpj}-${timestamp}.zip`;

    // Criar stream de saída
    const outputStream = new PassThrough();

    // Criar arquivo ZIP
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Máxima compressão
    });

    // Tratar erros do arquivo
    archive.on('error', (err: Error) => {
      console.error('[BatchDownload] Erro ao criar ZIP:', err);
      outputStream.destroy(err);
    });

    // Conectar arquivo ao stream de saída
    archive.pipe(outputStream);

    // Processar cada chave de acesso
    let processedCount = 0;
    for (const accessKeyId of accessKeyIds) {
      try {
        const accessKey = await db.getNfceAccessKeyByAccessKey(accessKeyId.toString());
        
        if (!accessKey) {
          console.warn(`[BatchDownload] Chave de acesso não encontrada: ${accessKeyId}`);
          continue;
        }

        // Se o XML já foi baixado, recuperar do S3
        if (accessKey.xmlDownloaded && accessKey.xmlKey) {
          try {
            // Simular recuperação do XML do S3
            const xmlContent = `<!-- XML da NFC-e ${accessKey.accessKey} -->`;
            const fileName = `${accessKey.accessKey}.xml`;
            
            archive.append(xmlContent, { name: fileName });
            processedCount++;
          } catch (error) {
            console.error(`[BatchDownload] Erro ao adicionar XML ${accessKey.accessKey}:`, error);
          }
        }
      } catch (error) {
        console.error(`[BatchDownload] Erro ao processar chave ${accessKeyId}:`, error);
      }
    }

    // Finalizar arquivo
    await archive.finalize();

    // Registrar auditoria
    await db.createAuditLog({
      userId,
      action: 'batch_download_initiated',
      resourceType: 'nfce_batch_download',
      resourceId: queryId.toString(),
      cnpj: query.cnpj,
      details: {
        totalFiles: accessKeyIds.length,
        processedFiles: processedCount,
        fileName,
      },
      status: 'success',
      ipAddress: 'unknown',
      userAgent: 'batch-service',
    });

    return {
      stream: outputStream,
      fileName,
      totalFiles: processedCount,
    };
  }

  /**
   * Obtém o progresso de um download em lote
   */
  static getProgress(sessionId: string): DownloadProgress {
    // Implementar gerenciamento de sessão com Redis ou similar
    // Por enquanto, retornar status padrão
    return {
      totalItems: 0,
      completedItems: 0,
      failedItems: 0,
      currentFile: '',
      status: 'pending',
    };
  }

  /**
   * Valida se as chaves de acesso pertencem à consulta
   */
  static async validateAccessKeys(
    accessKeyIds: number[],
    queryId: number
  ): Promise<{ valid: boolean; invalidIds: number[] }> {
    const invalidIds: number[] = [];

    for (const id of accessKeyIds) {
      const accessKey = await db.getNfceAccessKeyByAccessKey(id.toString());
      if (!accessKey || accessKey.queryId !== queryId) {
        invalidIds.push(id);
      }
    }

    return {
      valid: invalidIds.length === 0,
      invalidIds,
    };
  }

  /**
   * Calcula o tamanho total estimado dos XMLs
   */
  static async estimateTotalSize(accessKeyIds: number[]): Promise<number> {
    // Tamanho médio estimado de um XML de NFC-e: ~50KB
    const estimatedSizePerXml = 50 * 1024;
    return accessKeyIds.length * estimatedSizePerXml;
  }
}
