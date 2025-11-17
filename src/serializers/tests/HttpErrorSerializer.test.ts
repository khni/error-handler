import { describe, it, expect } from "vitest";
import { HttpError } from "../../errors/HttpError.js";
import { HttpErrorConstructor } from "../../errors/types.js";
import { HttpErrorSerializer } from "../HttpErrorSerializer.js";

describe("HttpErrorSerializer", () => {
  const serializer = new HttpErrorSerializer();

  class TestHttpError extends HttpError {
    statusCode = 404; // required abstract property

    constructor(
      options: HttpErrorConstructor & { name: string; responseMessage: string }
    ) {
      super(options);
    }
  }

  const makeHttpError = (overrides: Partial<HttpError> = {}) => {
    const err = new TestHttpError({
      name: "HttpError",
      message: "Top level error",
      code: "E_TOP",
      logLevel: "error",
      responseMessage: "Top level response",
      meta: { foo: "bar" },

      ...overrides,
    });
    return err;
  };

  it("should serialize top-level error correctly", () => {
    const err = makeHttpError();

    const result = serializer.serializerError(err);

    expect(result.topLevel.name).toBe("HttpError");
    expect(result.topLevel.message).toBe("Top level error");
    expect(result.topLevel.code).toBe("E_TOP");
    expect(result.topLevel.logLevel).toBe("error");
    expect(result.topLevel.responseMessage).toBe("Top level response");
    expect(result.topLevel.meta).toEqual({ foo: "bar" });
    expect(result.topLevel.stack).toContain("HttpError");
    expect(result.causeChain).toEqual([]);
  });

  it("should include cause chain with nested errors", () => {
    const innerCause = new Error("Inner cause");
    (innerCause as any).code = "INNER";
    (innerCause as any).responseMessage = "Inner response";
    (innerCause as any).meta = { detail: 42 };

    const outerCause = new Error("Outer cause");
    (outerCause as any).cause = innerCause;
    (outerCause as any).code = "OUTER";

    const err = makeHttpError({ cause: outerCause });
    const result = serializer.serializerError(err);

    expect(result.causeChain).toHaveLength(2);
    expect(result.causeChain[0]).toMatchObject({
      name: "Error",
      message: "Outer cause",
      code: "OUTER",
    });
    expect(result.causeChain[1]).toMatchObject({
      name: "Error",
      message: "Inner cause",
      code: "INNER",
      responseMessage: "Inner response",
      meta: { detail: 42 },
    });
  });

  it("should stop after 100 nested causes to avoid infinite loop", () => {
    // Create a deep chain > 100
    let current: Error = new Error("last");
    for (let i = 0; i < 150; i++) {
      const next = new Error(`cause-${i}`);
      (next as any).cause = current;
      current = next;
    }
    const err = makeHttpError({ cause: current });

    const result = serializer.serializerError(err);
    expect(result.causeChain.length).toBeLessThanOrEqual(100);
  });

  it("should handle error without cause safely", () => {
    const err = makeHttpError({ cause: undefined });
    const result = serializer.serializerError(err);
    expect(result.causeChain).toEqual([]);
  });

  it("should serialize response correctly", () => {
    const err = makeHttpError();
    const response = serializer.serializeResponse(err);

    expect(response).toEqual({
      error: {
        message: "Top level response",
        code: "E_TOP",
        name: "HttpError",
      },
      errorType: "Server",
    });
  });
});
