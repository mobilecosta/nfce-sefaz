import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { storagePut, storageGet } from "./storage";
import { SefazClient } from "./sefazClient";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Certificate management
  certificate: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getCertificatesByUserId(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const cert = await db.getCertificateById(input.id);
        if (!cert || cert.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return cert;
      }),

    upload: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileContent: z.string(), // base64
        cnpj: z.string().regex(/^\d{14}$/),
        password: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Validar certificado (básico)
          if (!input.fileContent || input.fileContent.length === 0) {
            throw new Error("Arquivo de certificado vazio");
          }

          // Gerar chave única para armazenamento
          const timestamp = Date.now();
          const certificateKey = `certificates/${ctx.user.id}/${timestamp}-${input.fileName}`;

          // Fazer upload para S3
          const buffer = Buffer.from(input.fileContent, 'base64');
          const { url } = await storagePut(certificateKey, buffer, 'application/x-pkcs12');

          // Salvar metadados no banco
          const certificate = await db.createCertificate({
            userId: ctx.user.id,
            cnpj: input.cnpj,
            certificateKey,
            certificateName: input.fileName,
            issuer: "Pendente de validação",
            subject: "Pendente de validação",
            validFrom: new Date(),
            validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            fingerprint: "pending",
            isActive: true,
          });

          // Registrar auditoria
          await db.createAuditLog({
            userId: ctx.user.id,
            action: "certificate_uploaded",
            resourceType: "certificate",
            resourceId: certificate.toString(),
            cnpj: input.cnpj,
            status: "success",
            ipAddress: ctx.req.headers['x-forwarded-for'] as string || "unknown",
            userAgent: ctx.req.headers['user-agent'] as string,
          });

          return {
            id: certificate,
            certificateName: input.fileName,
            cnpj: input.cnpj,
            isActive: true,
          };
        } catch (error) {
          // Registrar erro
          await db.createAuditLog({
            userId: ctx.user.id,
            action: "certificate_upload_failed",
            resourceType: "certificate",
            cnpj: input.cnpj,
            status: "error",
            details: { error: error instanceof Error ? error.message : "Erro desconhecido" },
            ipAddress: ctx.req.headers['x-forwarded-for'] as string || "unknown",
            userAgent: ctx.req.headers['user-agent'] as string,
          });

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Erro ao fazer upload do certificado",
          });
        }
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const cert = await db.getCertificateById(input.id);
        if (!cert || cert.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        await db.deleteCertificate(input.id);

        await db.createAuditLog({
          userId: ctx.user.id,
          action: "certificate_deleted",
          resourceType: "certificate",
          resourceId: input.id.toString(),
          cnpj: cert.cnpj,
          status: "success",
          ipAddress: ctx.req.headers['x-forwarded-for'] as string || "unknown",
          userAgent: ctx.req.headers['user-agent'] as string,
        });

        return { success: true };
      }),
  }),

  // NFC-e Query operations
  nfce: router({
    query: protectedProcedure
      .input(z.object({
        certificateId: z.number(),
        cnpj: z.string().regex(/^\d{14}$/),
        startDate: z.date(),
        endDate: z.date(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Validar certificado pertence ao usuário
          const cert = await db.getCertificateById(input.certificateId);
          if (!cert || cert.userId !== ctx.user.id) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Certificado não encontrado" });
          }

          // Criar registro de consulta
          const result = await db.createNfceQuery({
            userId: ctx.user.id,
            certificateId: input.certificateId,
            cnpj: input.cnpj,
            startDate: input.startDate,
            endDate: input.endDate,
            status: "pending",
          });
          const queryRecord = (result as any).insertId || 1;

          // Registrar auditoria
          await db.createAuditLog({
            userId: ctx.user.id,
            action: "query_started",
            resourceType: "nfce_query",
            resourceId: queryRecord.toString(),
            cnpj: input.cnpj,
            details: {
              startDate: input.startDate.toISOString(),
              endDate: input.endDate.toISOString(),
            },
            status: "success",
            ipAddress: ctx.req.headers['x-forwarded-for'] as string || "unknown",
            userAgent: ctx.req.headers['user-agent'] as string,
          });

          // Simular chamada ao SEFAZ (implementar integração real depois)
          // const sefazClient = new SefazClient({
          //   environment: 'homologacao',
          //   certificatePath: cert.certificateKey,
          //   certificatePassword: 'password',
          // });

          // Atualizar status para sucesso
          await db.updateNfceQuery(queryRecord, {
            status: "success",
            totalKeysFound: 0, // Será preenchido com dados reais
          });

          return {
            queryId: queryRecord,
            status: "success",
            totalKeysFound: 0,
          };
        } catch (error) {
          await db.createAuditLog({
            userId: ctx.user.id,
            action: "query_failed",
            resourceType: "nfce_query",
            cnpj: input.cnpj,
            status: "error",
            details: { error: error instanceof Error ? error.message : "Erro desconhecido" },
            ipAddress: ctx.req.headers['x-forwarded-for'] as string || "unknown",
            userAgent: ctx.req.headers['user-agent'] as string,
          });

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Erro ao consultar SEFAZ",
          });
        }
      }),

    getQueries: protectedProcedure.query(async ({ ctx }) => {
      return await db.getNfceQueriesByUserId(ctx.user.id);
    }),

    getQuery: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const query = await db.getNfceQueryById(input.id);
        if (!query || query.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return query;
      }),

    getAccessKeys: protectedProcedure
      .input(z.object({ queryId: z.number() }))
      .query(async ({ ctx, input }) => {
        const query = await db.getNfceQueryById(input.queryId);
        if (!query || query.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return await db.getNfceAccessKeysByQueryId(input.queryId);
      }),

    downloadXML: protectedProcedure
      .input(z.object({ accessKeyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Implementar download de XML
          await db.createAuditLog({
            userId: ctx.user.id,
            action: "xml_download_started",
            resourceType: "nfce_download",
            resourceId: input.accessKeyId.toString(),
            status: "success",
            ipAddress: ctx.req.headers['x-forwarded-for'] as string || "unknown",
            userAgent: ctx.req.headers['user-agent'] as string,
          });

          return { success: true, downloadUrl: "" };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erro ao baixar XML",
          });
        }
      }),
  }),

  // Admin operations
  admin: router({
    getAllUsers: protectedProcedure
      .use(async ({ ctx, next }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return next({ ctx });
      })
      .query(async () => {
        return await db.getAllUsers();
      }),

    getAuditLogs: protectedProcedure
      .use(async ({ ctx, next }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return next({ ctx });
      })
      .query(async () => {
        return await db.getAllAuditLogs();
      }),

    updateUserRole: protectedProcedure
      .use(async ({ ctx, next }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return next({ ctx });
      })
      .input(z.object({
        userId: z.number(),
        role: z.enum(['user', 'admin']),
      }))
      .mutation(async ({ input }) => {
        await db.updateUser(input.userId, { role: input.role });
        return { success: true };
      }),

    toggleUserActive: protectedProcedure
      .use(async ({ ctx, next }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return next({ ctx });
      })
      .input(z.object({
        userId: z.number(),
        isActive: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        await db.updateUser(input.userId, { isActive: input.isActive });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
