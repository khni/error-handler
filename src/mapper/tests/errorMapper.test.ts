import { describe, it, expect } from "vitest";
import { CustomError } from "../../errors/CustomError.js";
import { CustomErrorConstructor, LogLevel } from "../../errors/types.js";
import { errorMapper } from "../errorMapper.js";
import { MappedHttpError } from "../MappedHttpError.js";

// Concrete CustomError implementation for testing
class TestCustomError extends CustomError<string> {
  constructor(options: CustomErrorConstructor<string> & { name: string }) {
    super(options);
  }
}

describe("errorMapper", () => {
  it("should return a MappedHttpError with mapped statusCode and responseMessage when mapping exists", () => {
    const error = new TestCustomError({
      name: "MappedError",
      message: "Something bad happened",
      code: "E_MAPPED",
      logLevel: "error" as LogLevel,
      meta: { userId: 123 },
      cause: new Error("Root cause"),
    });

    const mapping = {
      E_MAPPED: { statusCode: 400, responseMessage: "Bad Request" },
    };

    const result = errorMapper(error, mapping);

    expect(result).toBeInstanceOf(MappedHttpError);
    expect(result.statusCode).toBe(400);
    expect(result.responseMessage).toBe("Bad Request");

    // Ensure it carries over all original properties
    expect(result.name).toBe("MappedError");
    expect(result.message).toBe("Something bad happened");
    expect(result.code).toBe("E_MAPPED");
    expect(result.logLevel).toBe("error");
    expect(result.meta).toEqual({ userId: 123 });
    expect(result.cause).toBe(error.cause);
  });

  it("should return a MappedHttpError with default statusCode and message when no mapping exists", () => {
    const error = new TestCustomError({
      name: "UnmappedError",
      message: "This code is not in the map",
      code: "E_UNKNOWN",
      logLevel: "warn" as LogLevel,
    });

    const mapping = {
      E_OTHER: { statusCode: 404, responseMessage: "Not Found" },
    };

    const result = errorMapper(error, mapping);

    expect(result).toBeInstanceOf(MappedHttpError);
    expect(result.statusCode).toBe(500);
    expect(result.responseMessage).toBe("Internal Server Error");

    // Still carries original error info
    expect(result.name).toBe("UnmappedError");
    expect(result.message).toBe("This code is not in the map");
    expect(result.code).toBe("E_UNKNOWN");
    expect(result.logLevel).toBe("warn");
  });

  it("should handle symbol or numeric codes as keys", () => {
    const numericCodeError = new TestCustomError({
      name: "NumericError",
      message: "Number code",
      code: 123 as unknown as string,
      logLevel: "info" as LogLevel,
    });

    const symbolCode = Symbol("ERR_SYMBOL");
    const symbolCodeError = new TestCustomError({
      name: "SymbolError",
      message: "Symbol code",
      code: symbolCode as unknown as string,
      logLevel: "debug" as LogLevel,
    });

    const mapping = {
      [123]: { statusCode: 418, responseMessage: "I'm a teapot" },
      [symbolCode]: { statusCode: 402, responseMessage: "Payment Required" },
    };

    const numericResult = errorMapper(numericCodeError, mapping);
    expect(numericResult.statusCode).toBe(418);
    expect(numericResult.responseMessage).toBe("I'm a teapot");

    const symbolResult = errorMapper(symbolCodeError, mapping);
    expect(symbolResult.statusCode).toBe(402);
    expect(symbolResult.responseMessage).toBe("Payment Required");
  });
});
