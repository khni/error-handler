// ErrorHandler.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { IErrorHandlingStrategy } from "../interfaces/IErrorHandlingStrategy.js";
import { ErrorHandler } from "../ErrorHandlerContext.js";

describe("ErrorHandler", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockNext = vi.fn();

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  it("calls the first strategy that can handle the error", () => {
    const fakeError = new Error("Boom!");

    const firstStrategy: IErrorHandlingStrategy = {
      canHandle: vi.fn().mockReturnValue(true),
      handle: vi.fn(),
    };
    const secondStrategy: IErrorHandlingStrategy = {
      canHandle: vi.fn().mockReturnValue(true),
      handle: vi.fn(),
    };

    const handler = new ErrorHandler([firstStrategy, secondStrategy]);
    handler.handle(
      fakeError,
      mockReq as Request,
      mockRes as Response,
      mockNext
    );

    // First strategy is used
    expect(firstStrategy.canHandle).toHaveBeenCalledWith(fakeError);
    expect(firstStrategy.handle).toHaveBeenCalledWith(fakeError, mockRes);

    // Second strategy is never checked (because .find stops at first true)
    expect(secondStrategy.canHandle).not.toHaveBeenCalled();
    expect(secondStrategy.handle).not.toHaveBeenCalled();

    // Fallback not called
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it("skips strategies that cannot handle and uses the first that can", () => {
    const fakeError = new Error("Another error");

    const firstStrategy: IErrorHandlingStrategy = {
      canHandle: vi.fn().mockReturnValue(false),
      handle: vi.fn(),
    };
    const secondStrategy: IErrorHandlingStrategy = {
      canHandle: vi.fn().mockReturnValue(true),
      handle: vi.fn(),
    };

    const handler = new ErrorHandler([firstStrategy, secondStrategy]);
    handler.handle(
      fakeError,
      mockReq as Request,
      mockRes as Response,
      mockNext
    );

    expect(firstStrategy.canHandle).toHaveBeenCalledWith(fakeError);
    expect(firstStrategy.handle).not.toHaveBeenCalled();
    expect(secondStrategy.canHandle).toHaveBeenCalledWith(fakeError);
    expect(secondStrategy.handle).toHaveBeenCalledWith(fakeError, mockRes);
  });

  it("returns 500 JSON response when no strategy can handle", () => {
    const fakeError = new Error("Unhandled error");

    const firstStrategy: IErrorHandlingStrategy = {
      canHandle: vi.fn().mockReturnValue(false),
      handle: vi.fn(),
    };
    const secondStrategy: IErrorHandlingStrategy = {
      canHandle: vi.fn().mockReturnValue(false),
      handle: vi.fn(),
    };

    const handler = new ErrorHandler([firstStrategy, secondStrategy]);
    handler.handle(
      fakeError,
      mockReq as Request,
      mockRes as Response,
      mockNext
    );

    expect(firstStrategy.canHandle).toHaveBeenCalledWith(fakeError);
    expect(secondStrategy.canHandle).toHaveBeenCalledWith(fakeError);

    // Fallback response called
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      code: "UNKNOWN_ERROR",
      message: "An Expected error occurred.",
      name: "unknown",
    });

    // No strategy.handle is called
    expect(firstStrategy.handle).not.toHaveBeenCalled();
    expect(secondStrategy.handle).not.toHaveBeenCalled();
  });
});
