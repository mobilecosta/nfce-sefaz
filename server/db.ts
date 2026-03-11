import { eq, and, desc, gte, lte, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, certificates, nfceQueries, nfceAccessKeys, auditLogs, InsertCertificate, InsertNfceQuery, InsertNfceAccessKey, InsertAuditLog } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUser(id: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, id));
}

// Certificate operations
export async function createCertificate(data: InsertCertificate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(certificates).values(data);
  return result[0];
}

export async function getCertificatesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(certificates).where(eq(certificates.userId, userId));
}

export async function getCertificateById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(certificates).where(eq(certificates.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateCertificate(id: number, data: Partial<InsertCertificate>) {
  const db = await getDb();
  if (!db) return;
  await db.update(certificates).set(data).where(eq(certificates.id, id));
}

export async function deleteCertificate(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(certificates).where(eq(certificates.id, id));
}

// NFC-e Query operations
export async function createNfceQuery(data: InsertNfceQuery) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(nfceQueries).values(data);
  return result[0];
}

export async function getNfceQueriesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(nfceQueries).where(eq(nfceQueries.userId, userId)).orderBy(desc(nfceQueries.createdAt));
}

export async function getNfceQueryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(nfceQueries).where(eq(nfceQueries.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateNfceQuery(id: number, data: Partial<InsertNfceQuery>) {
  const db = await getDb();
  if (!db) return;
  await db.update(nfceQueries).set(data).where(eq(nfceQueries.id, id));
}

// NFC-e Access Key operations
export async function createNfceAccessKey(data: InsertNfceAccessKey) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(nfceAccessKeys).values(data);
  return result[0];
}

export async function getNfceAccessKeysByQueryId(queryId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(nfceAccessKeys).where(eq(nfceAccessKeys.queryId, queryId)).orderBy(desc(nfceAccessKeys.createdAt));
}

export async function getNfceAccessKeyByAccessKey(accessKey: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(nfceAccessKeys).where(eq(nfceAccessKeys.accessKey, accessKey)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateNfceAccessKey(id: number, data: Partial<InsertNfceAccessKey>) {
  const db = await getDb();
  if (!db) return;
  await db.update(nfceAccessKeys).set(data).where(eq(nfceAccessKeys.id, id));
}

// Audit Log operations
export async function createAuditLog(data: InsertAuditLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(auditLogs).values(data);
}

export async function getAuditLogsByUserId(userId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(auditLogs).where(eq(auditLogs.userId, userId)).orderBy(desc(auditLogs.createdAt)).limit(limit);
}

export async function getAllAuditLogs(limit = 500) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
}

export async function getAuditLogsByAction(action: string, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(auditLogs).where(like(auditLogs.action, `%${action}%`)).orderBy(desc(auditLogs.createdAt)).limit(limit);
}

export async function getAuditLogsByDateRange(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(auditLogs).where(and(gte(auditLogs.createdAt, startDate), lte(auditLogs.createdAt, endDate))).orderBy(desc(auditLogs.createdAt));
}
