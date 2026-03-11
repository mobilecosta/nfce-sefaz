import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { BatchDownloadService } from "./batchDownloadService";
import { TRPCError } from "@trpc/server";

/**
 * Router para operações de download em lote
 */
export const batchRouter = router({
  /**
   * Inicia um download em lote de XMLs
   * Retorna um stream que pode ser consumido como arquivo ZIP
   */
  downloadBatch: protectedProcedure
    .input(z.object({
      queryId: z.number(),
      accessKeyIds: z.array(z.number()).min(1, "Selecione pelo menos uma chave"),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Validar que a consulta pertence ao usuário
        const query = await db.getNfceQueryById(input.queryId);
        if (!query || query.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Consulta não encontrada" });
        }

        // Validar as chaves de acesso
        const validation = await BatchDownloadService.validateAccessKeys(
          input.accessKeyIds,
          input.queryId
        );

        if (!validation.valid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Chaves de acesso inválidas: ${validation.invalidIds.join(", ")}`,
          });
        }

        // Estimar tamanho total
        const estimatedSize = await BatchDownloadService.estimateTotalSize(input.accessKeyIds);

        // Criar ZIP
        const { stream, fileName, totalFiles } = await BatchDownloadService.createBatchZip({
          accessKeyIds: input.accessKeyIds,
          queryId: input.queryId,
          userId: ctx.user.id,
        });

        // Registrar auditoria
        await db.createAuditLog({
          userId: ctx.user.id,
          action: "batch_download_completed",
          resourceType: "nfce_batch_download",
          resourceId: input.queryId.toString(),
          cnpj: query.cnpj,
          details: {
            totalFiles,
            estimatedSize,
            fileName,
          },
          status: "success",
          ipAddress: (ctx.req.headers['x-forwarded-for'] as string) || "unknown",
          userAgent: (ctx.req.headers['user-agent'] as string),
        });

        return {
          success: true,
          fileName,
          totalFiles,
          estimatedSize,
          downloadUrl: `/api/download/batch/${input.queryId}`,
        };
      } catch (error) {
        // Registrar erro
        await db.createAuditLog({
          userId: ctx.user.id,
          action: "batch_download_failed",
          resourceType: "nfce_batch_download",
          resourceId: input.queryId.toString(),
          status: "error",
          details: { error: error instanceof Error ? error.message : "Erro desconhecido" },
          ipAddress: (ctx.req.headers['x-forwarded-for'] as string) || "unknown",
          userAgent: (ctx.req.headers['user-agent'] as string),
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao criar download em lote",
        });
      }
    }),

  /**
   * Valida as chaves de acesso antes do download
   */
  validateBatch: protectedProcedure
    .input(z.object({
      queryId: z.number(),
      accessKeyIds: z.array(z.number()),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const query = await db.getNfceQueryById(input.queryId);
        if (!query || query.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        const validation = await BatchDownloadService.validateAccessKeys(
          input.accessKeyIds,
          input.queryId
        );

        const estimatedSize = await BatchDownloadService.estimateTotalSize(input.accessKeyIds);

        return {
          valid: validation.valid,
          invalidIds: validation.invalidIds,
          estimatedSize,
          totalFiles: input.accessKeyIds.length - validation.invalidIds.length,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao validar chaves",
        });
      }
    }),

  /**
   * Obtém informações sobre um download em lote
   */
  getBatchInfo: protectedProcedure
    .input(z.object({
      queryId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const query = await db.getNfceQueryById(input.queryId);
        if (!query || query.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        const accessKeys = await db.getNfceAccessKeysByQueryId(input.queryId);
        const downloadedCount = accessKeys.filter(k => k.xmlDownloaded).length;
        const totalSize = await BatchDownloadService.estimateTotalSize(
          accessKeys.map(k => k.id)
        );

        return {
          queryId: input.queryId,
          cnpj: query.cnpj,
          totalKeys: accessKeys.length,
          downloadedKeys: downloadedCount,
          totalSize,
          accessKeys: accessKeys.map(k => ({
            id: k.id,
            accessKey: k.accessKey,
            downloaded: k.xmlDownloaded,
            emissionDate: k.emissionDate,
            totalValue: k.totalValue,
          })),
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao obter informações do download",
        });
      }
    }),
});
