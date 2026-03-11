import { describe, expect, it, beforeEach } from "vitest";
import { ProgressManager } from "./progressManager";

describe("ProgressManager", () => {
  beforeEach(() => {
    // Limpar todas as sessões antes de cada teste
    const sessions = (ProgressManager as any).sessions;
    sessions.clear();
  });

  describe("createSession", () => {
    it("should create a new progress session", () => {
      const session = ProgressManager.createSession(
        "session-1",
        1,
        100,
        10,
        1024 * 1024 // 1MB
      );

      expect(session.sessionId).toBe("session-1");
      expect(session.userId).toBe(1);
      expect(session.queryId).toBe(100);
      expect(session.totalFiles).toBe(10);
      expect(session.totalSize).toBe(1024 * 1024);
      expect(session.completedFiles).toBe(0);
      expect(session.failedFiles).toBe(0);
      expect(session.status).toBe("pending");
    });

    it("should retrieve created session", () => {
      ProgressManager.createSession("session-1", 1, 100, 10, 1024 * 1024);
      const session = ProgressManager.getSession("session-1");

      expect(session).toBeDefined();
      expect(session?.sessionId).toBe("session-1");
    });

    it("should return undefined for non-existent session", () => {
      const session = ProgressManager.getSession("non-existent");
      expect(session).toBeUndefined();
    });
  });

  describe("updateProgress", () => {
    it("should update progress correctly", () => {
      ProgressManager.createSession("session-1", 1, 100, 10, 1024 * 1024);

      const event = ProgressManager.updateProgress(
        "session-1",
        5,
        0,
        512 * 1024,
        "file-5.xml"
      );

      expect(event).toBeDefined();
      expect(event?.completedFiles).toBe(5);
      expect(event?.failedFiles).toBe(0);
      expect(event?.processedSize).toBe(512 * 1024);
      expect(event?.percentage).toBe(50);
      expect(event?.currentFile).toBe("file-5.xml");
    });

    it("should return null for non-existent session", () => {
      const event = ProgressManager.updateProgress("non-existent", 5, 0, 512 * 1024);
      expect(event).toBeNull();
    });
  });

  describe("completeFile", () => {
    it("should mark file as completed and update progress", () => {
      ProgressManager.createSession("session-1", 1, 100, 10, 1024 * 1024);

      const event = ProgressManager.completeFile("session-1", 102400, "file-1.xml");

      expect(event).toBeDefined();
      expect(event?.completedFiles).toBe(1);
      expect(event?.processedSize).toBe(102400);
      expect(event?.percentage).toBe(10);
    });

    it("should increment completed files count", () => {
      ProgressManager.createSession("session-1", 1, 100, 10, 1024 * 1024);

      ProgressManager.completeFile("session-1", 102400);
      ProgressManager.completeFile("session-1", 102400);
      const event = ProgressManager.completeFile("session-1", 102400);

      expect(event?.completedFiles).toBe(3);
    });
  });

  describe("failFile", () => {
    it("should increment failed files count", () => {
      ProgressManager.createSession("session-1", 1, 100, 10, 1024 * 1024);

      ProgressManager.failFile("session-1");
      const event = ProgressManager.failFile("session-1");

      expect(event?.failedFiles).toBe(2);
    });
  });

  describe("completeSession", () => {
    it("should mark session as completed", () => {
      ProgressManager.createSession("session-1", 1, 100, 10, 1024 * 1024);

      const event = ProgressManager.completeSession("session-1");

      expect(event).toBeDefined();
      expect(event?.type).toBe("completed");
      expect(event?.percentage).toBe(100);
    });
  });

  describe("errorSession", () => {
    it("should mark session as error", () => {
      ProgressManager.createSession("session-1", 1, 100, 10, 1024 * 1024);

      const event = ProgressManager.errorSession("session-1", "Test error");

      expect(event).toBeDefined();
      expect(event?.type).toBe("error");
      expect(event?.errorMessage).toBe("Test error");
    });
  });

  describe("getActiveSessionsCount", () => {
    it("should return correct count of active sessions", () => {
      ProgressManager.createSession("session-1", 1, 100, 10, 1024 * 1024);
      ProgressManager.createSession("session-2", 2, 101, 10, 1024 * 1024);

      const count = ProgressManager.getActiveSessionsCount();
      expect(count).toBe(2);
    });

    it("should return 0 when no sessions exist", () => {
      const count = ProgressManager.getActiveSessionsCount();
      expect(count).toBe(0);
    });
  });

  describe("clearSession", () => {
    it("should remove a session", () => {
      ProgressManager.createSession("session-1", 1, 100, 10, 1024 * 1024);
      ProgressManager.clearSession("session-1");

      const session = ProgressManager.getSession("session-1");
      expect(session).toBeUndefined();
    });
  });
});
