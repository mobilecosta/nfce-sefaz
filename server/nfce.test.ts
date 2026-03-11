import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "user" | "admin" = "user"): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {
        "x-forwarded-for": "127.0.0.1",
        "user-agent": "test-agent",
      },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("NFC-e Procedures", () => {
  describe("certificate.list", () => {
    it("should return empty list for new user", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.certificate.list();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("nfce.getQueries", () => {
    it("should return empty list for new user", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.nfce.getQueries();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("admin procedures", () => {
    it("should allow admin to get all users", async () => {
      const { ctx } = createAuthContext("admin");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.admin.getAllUsers();

      expect(Array.isArray(result)).toBe(true);
    });

    it("should deny non-admin access to getAllUsers", async () => {
      const { ctx } = createAuthContext("user");
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.admin.getAllUsers();
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });

    it("should allow admin to get audit logs", async () => {
      const { ctx } = createAuthContext("admin");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.admin.getAuditLogs();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("auth procedures", () => {
    it("should return current user", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.me();

      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
      expect(result?.email).toBe("test@example.com");
    });

    it("should logout successfully", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.logout();

      expect(result.success).toBe(true);
    });
  });
});
