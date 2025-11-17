import { describe, it, expect } from "vitest";
import { CustomError } from "../CustomError.js";
import { CustomErrorConstructor, LogLevel } from "../types.js";

// concrete subclass for testing
class TestError extends CustomError<string> {
  constructor(options: CustomErrorConstructor<string> & { name: string }) {
    super(options);
  }
}

describe("CustomError", () => {
  it("should correctly assign all properties", () => {
    const cause = new Error("Root cause");
    const error = new TestError({
      name: "TestError",
      message: "Something went wrong",
      meta: { extra: "info" },
      code: "E_TEST",
      logLevel: "error" as LogLevel,
      cause,
    });

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(TestError);
    expect(error.name).toBe("TestError");
    expect(error.message).toBe("Something went wrong");
    expect(error.meta).toEqual({ extra: "info" });
    expect(error.code).toBe("E_TEST");
    expect(error.logLevel).toBe("error");
    expect(error.cause).toBe(cause);
  });

  it("should have undefined meta and cause if not provided", () => {
    const error = new TestError({
      name: "NoMetaError",
      message: "No meta data here",
      code: "E_NO_META",
      logLevel: "warn" as LogLevel,
    });

    expect(error.meta).toBeUndefined();
    expect(error.cause).toBeUndefined();
  });

  it("should preserve prototype chain for instanceof checks", () => {
    const error = new TestError({
      name: "ProtoError",
      message: "Prototype chain check",
      code: "E_PROTO",
      logLevel: "info" as LogLevel,
    });

    // Ensures Object.setPrototypeOf worked
    expect(error instanceof TestError).toBe(true);
    expect(error instanceof CustomError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });

  it("should have correct toString representation", () => {
    const error = new TestError({
      name: "StringError",
      message: "Testing toString",
      code: "E_STRING",
      logLevel: "debug" as LogLevel,
    });

    expect(error.toString()).toContain("StringError");
    expect(error.toString()).toContain("Testing toString");
  });
});
