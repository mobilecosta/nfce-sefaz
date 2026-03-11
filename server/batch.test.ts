import { describe, expect, it } from "vitest";
import { BatchDownloadService } from "./batchDownloadService";

describe("BatchDownloadService", () => {
  describe("estimateTotalSize", () => {
    it("should calculate estimated size for multiple files", async () => {
      const accessKeyIds = [1, 2, 3, 4, 5];
      const size = await BatchDownloadService.estimateTotalSize(accessKeyIds);

      // 5 arquivos * 50KB por arquivo = 250KB
      expect(size).toBe(5 * 50 * 1024);
    });

    it("should return 0 for empty array", async () => {
      const size = await BatchDownloadService.estimateTotalSize([]);
      expect(size).toBe(0);
    });

    it("should handle single file", async () => {
      const size = await BatchDownloadService.estimateTotalSize([1]);
      expect(size).toBe(50 * 1024);
    });

    it("should handle large number of files", async () => {
      const accessKeyIds = Array.from({ length: 1000 }, (_, i) => i + 1);
      const size = await BatchDownloadService.estimateTotalSize(accessKeyIds);

      expect(size).toBe(1000 * 50 * 1024);
    });
  });

  describe("validateAccessKeys", () => {
    it("should validate empty array", async () => {
      const result = await BatchDownloadService.validateAccessKeys([], 1);
      expect(result.valid).toBe(true);
      expect(result.invalidIds).toEqual([]);
    });
  });
});
