import { Mocked, vi } from "vitest";
import type { Response } from "express";
import { ILogger } from "../../errors/types.js";
export const mockResponse = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  return res as Response;
};

export const mockLogger: Mocked<ILogger> = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
};
