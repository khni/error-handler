import { describe, it, expect, vi } from "vitest";

import type { Response } from "express";
import { FallbackErrorStrategy } from "../FallBackErrorHandlerStrategy.js";
import { mockLogger } from "./mocks.js";
import { errorResponse } from "./data.js";

describe("FallbackErrorStrategy", () => {
  it("should always return true for canHandle", () => {
    const strategy = new FallbackErrorStrategy();
    expect(strategy.canHandle(new Error("test"))).toBe(true);
  });

  it("should log the error if logger is provided", () => {
    const strategy = new FallbackErrorStrategy(mockLogger);

    const error = new Error("Something bad");
    (error as any).code = "ERR_TEST";
    (error as any).meta = { foo: "bar" };

    strategy.log(error);

    expect(mockLogger.error).toHaveBeenCalledWith(
      "UnexpectedErrorError",
      expect.objectContaining({
        topLevel: expect.objectContaining({
          name: "Error",
          message: "Something bad",
          code: "ERR_TEST",
          meta: { foo: "bar" },
          stack: expect.any(String),
        }),
      })
    );
  });

  it("should not throw if no logger is provided", () => {
    const strategy = new FallbackErrorStrategy();
    const error = new Error("Something bad");
    expect(() => strategy.log(error)).not.toThrow();
  });

  it("should send correct response when handle is called", () => {
    const strategy = new FallbackErrorStrategy(mockLogger);

    const error = new Error("Boom!");
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    strategy.handle(error, res);

    expect(mockLogger.error).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      errorType: "Server",
      error: {
        code: "UNKNOWN_ERROR",
        message: "An Expected error occurred.",
        name: "unknown",
      },
    });
  });
});
