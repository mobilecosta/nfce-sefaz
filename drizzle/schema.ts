import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint, decimal, boolean, json } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabela para armazenar metadados de certificados digitais e-CNPJ
 */
export const certificates = mysqlTable("certificates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  cnpj: varchar("cnpj", { length: 14 }).notNull(),
  certificateKey: varchar("certificateKey", { length: 255 }).notNull(), // Chave do arquivo no S3
  certificateName: varchar("certificateName", { length: 255 }).notNull(),
  issuer: text("issuer"),
  subject: text("subject"),
  validFrom: timestamp("validFrom"),
  validUntil: timestamp("validUntil"),
  fingerprint: varchar("fingerprint", { length: 64 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = typeof certificates.$inferInsert;

/**
 * Tabela para armazenar consultas de NFC-e realizadas
 */
export const nfceQueries = mysqlTable("nfce_queries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  certificateId: int("certificateId").notNull(),
  cnpj: varchar("cnpj", { length: 14 }).notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  totalKeysFound: int("totalKeysFound").default(0),
  status: mysqlEnum("status", ["pending", "success", "error"]).default("pending"),
  errorMessage: text("errorMessage"),
  responseData: json("responseData"), // Armazena resposta da SEFAZ
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NfceQuery = typeof nfceQueries.$inferSelect;
export type InsertNfceQuery = typeof nfceQueries.$inferInsert;

/**
 * Tabela para armazenar chaves de acesso de NFC-e encontradas
 */
export const nfceAccessKeys = mysqlTable("nfce_access_keys", {
  id: int("id").autoincrement().primaryKey(),
  queryId: int("queryId").notNull(),
  accessKey: varchar("accessKey", { length: 44 }).notNull().unique(),
  nfceNumber: varchar("nfceNumber", { length: 9 }),
  series: varchar("series", { length: 3 }),
  emissionDate: timestamp("emissionDate"),
  totalValue: decimal("totalValue", { precision: 15, scale: 2 }),
  xmlDownloaded: boolean("xmlDownloaded").default(false),
  xmlKey: varchar("xmlKey", { length: 255 }), // Chave do arquivo XML no S3
  downloadedAt: timestamp("downloadedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NfceAccessKey = typeof nfceAccessKeys.$inferSelect;
export type InsertNfceAccessKey = typeof nfceAccessKeys.$inferInsert;

/**
 * Tabela para armazenar logs de auditoria de consultas e downloads
 */
export const auditLogs = mysqlTable("audit_logs", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 50 }).notNull(), // query_started, query_completed, xml_downloaded, certificate_uploaded
  resourceType: varchar("resourceType", { length: 50 }), // certificate, nfce_query, nfce_download
  resourceId: varchar("resourceId", { length: 50 }),
  cnpj: varchar("cnpj", { length: 14 }),
  details: json("details"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  status: mysqlEnum("status", ["success", "error", "warning"]).default("success"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
