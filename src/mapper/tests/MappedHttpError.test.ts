import { describe, it, expect } from "vitest";
import { HttpError } from "../../errors/HttpError.js";
import { HttpErrorConstructor, LogLevel } from "../../errors/types.js";
import { MappedHttpError } from "../MappedHttpError.js";

// Test helper: concrete subclass of HttpError
class BaseHttpError extends HttpError {
  statusCode = 500;
  constructor(options: HttpErrorConstructor) {
    super(options);
  }
}

describe("MappedHttpError", () => {
  it("should copy all properties from the original HttpError", () => {
    const original = new BaseHttpError({
      name: "OriginalHttpError",
      message: "Something went wrong",
      responseMessage: "Server Error",
      code: "E_SERVER",
      logLevel: "error" as LogLevel,
      meta: { key: "value" },
      cause: new Error("Root cause"),
    });

    const mapped = new MappedHttpError(original);

    // Inherits from Error and HttpError
    expect(mapped).toBeInstanceOf(Error);
    expect(mapped).toBeInstanceOf(HttpError);
    expect(mapped).toBeInstanceOf(MappedHttpError);

    // Copies all fields from original
    expect(mapped.name).toBe(original.name);
    expect(mapped.message).toBe(original.message);
    expect(mapped.responseMessage).toBe(original.responseMessage);
    expect(mapped.code).toBe(original.code);
    expect(mapped.logLevel).toBe(original.logLevel);
    expect(mapped.meta).toBe(original.meta);
    expect(mapped.cause).toBe(original.cause);
    expect(mapped.statusCode).toBe(500);
  });

  it("should preserve prototype chain for instanceof checks", () => {
    const original = new BaseHttpError({
      name: "ProtoHttpError",
      message: "Prototype test",
      responseMessage: "Internal Error",
      code: "E_PROTO",
      logLevel: "info" as LogLevel,
    });

    const mapped = new MappedHttpError(original);

    expect(mapped instanceof MappedHttpError).toBe(true);
    expect(mapped instanceof HttpError).toBe(true);
    expect(mapped instanceof Error).toBe(true);
  });

  it("should include name and message in toString", () => {
    const original = new BaseHttpError({
      name: "StringMappedError",
      message: "Testing toString",
      responseMessage: "Custom Response",
      code: "E_STRING",
      logLevel: "debug" as LogLevel,
    });

    const mapped = new MappedHttpError(original);

    expect(mapped.toString()).toContain("StringMappedError");
    expect(mapped.toString()).toContain("Testing toString");
  });
});
