import { describe, it, expect } from "vitest";
import { HttpError } from "../HttpError.js";
import { HttpErrorConstructor, LogLevel } from "../types.js";

// Create a concrete subclass for testing
class TestHttpError extends HttpError {
  statusCode = 404; // required abstract property

  constructor(
    options: HttpErrorConstructor & { name: string; responseMessage: string }
  ) {
    super(options);
  }
}

describe("HttpError", () => {
  it("should correctly assign all properties", () => {
    const cause = new Error("Underlying cause");
    const error = new TestHttpError({
      name: "NotFoundError",
      message: "Resource not found",
      responseMessage: "Not Found",
      meta: { id: 123 },
      code: "E_NOT_FOUND",
      logLevel: "error" as LogLevel,
      cause,
    });

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(TestHttpError);
    expect(error.name).toBe("NotFoundError");
    expect(error.message).toBe("Resource not found");
    expect(error.responseMessage).toBe("Not Found");
    expect(error.meta).toEqual({ id: 123 });
    expect(error.code).toBe("E_NOT_FOUND");
    expect(error.logLevel).toBe("error");
    expect(error.cause).toBe(cause);
    expect(error.statusCode).toBe(404);
  });

  it("should have undefined meta and cause if not provided", () => {
    const error = new TestHttpError({
      name: "NoMetaHttpError",
      message: "No meta provided",
      responseMessage: "Bad Request",
      code: "E_NO_META",
      logLevel: "warn" as LogLevel,
    });

    expect(error.meta).toBeUndefined();
    expect(error.cause).toBeUndefined();
    expect(error.responseMessage).toBe("Bad Request");
  });

  it("should preserve prototype chain for instanceof checks", () => {
    const error = new TestHttpError({
      name: "ProtoHttpError",
      message: "Prototype test",
      responseMessage: "Internal Error",
      code: "E_PROTO",
      logLevel: "info" as LogLevel,
    });

    expect(error instanceof TestHttpError).toBe(true);
    expect(error instanceof HttpError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });

  it("should include name and message in toString", () => {
    const error = new TestHttpError({
      name: "StringHttpError",
      message: "Testing toString",
      responseMessage: "Custom Response",
      code: "E_STRING",
      logLevel: "debug" as LogLevel,
    });

    expect(error.toString()).toContain("StringHttpError");
    expect(error.toString()).toContain("Testing toString");
  });
});
