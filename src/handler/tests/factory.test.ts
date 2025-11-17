// createErrHandlerMiddleware.test.ts
import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { HttpErrorSerializer } from "../../serializers/HttpErrorSerializer.js";

import { ErrorHandler } from "../ErrorHandlerContext.js";
import { createErrHandlerMiddleware } from "../factory.js";
import { FallbackErrorStrategy } from "../FallBackErrorHandlerStrategy.js";
import { HttpErrorHandlerStrategy } from "../HttpErrorHandlerStrategy.js";

import { mockLogger } from "./mocks.js";
import { InputValidationErrorHandlerStrategy } from "../InputValidationErrorHandlerStrategy.js";

// Mock dependencies
vi.mock("../ErrorHandlerContext");
vi.mock("../HttpErrorHandlerStrategy");
vi.mock("../ZodErrorHandlerStrategy");
vi.mock("../FallBackErrorHandlerStrategy");
vi.mock("../../serializers/HttpErrorSerializer");
vi.mock("../../serializers/ZodErrorSerializer");

describe("createErrHandlerMiddleware", () => {
  const mockHandle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock ErrorHandler to return our fake handle function
    (ErrorHandler as unknown as Mock).mockImplementation(() => ({
      handle: mockHandle,
    }));
  });

  it("should construct ErrorHandler with the correct strategies", () => {
    const result = createErrHandlerMiddleware(mockLogger);

    // The function should return the handle method
    expect(result).toBe(mockHandle);

    // Ensure the serializers were instantiated
    expect(HttpErrorSerializer).toHaveBeenCalledTimes(1);

    // Ensure each strategy was instantiated with correct arguments
    expect(HttpErrorHandlerStrategy).toHaveBeenCalledWith(
      expect.any(HttpErrorSerializer),
      mockLogger
    );

    expect(FallbackErrorStrategy).toHaveBeenCalledWith(mockLogger);

    // Ensure ErrorHandler got the strategies in the right order
    expect(ErrorHandler).toHaveBeenCalledWith([
      expect.any(HttpErrorHandlerStrategy),
      expect.any(InputValidationErrorHandlerStrategy),
      expect.any(FallbackErrorStrategy),
    ]);
  });

  it("should work with no logger passed", () => {
    createErrHandlerMiddleware();

    expect(HttpErrorHandlerStrategy).toHaveBeenCalledWith(
      expect.any(HttpErrorSerializer),
      undefined
    );

    expect(FallbackErrorStrategy).toHaveBeenCalledWith(undefined);
  });
});
