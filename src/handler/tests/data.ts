import { ErrorResponse, HttpErrorConstructor } from "../../errors/types.js";

export const httpErrorConstructor: HttpErrorConstructor = {
  message: "Failed to fetch resource from API.",
  meta: {
    endpoint: "/api/products",
    retryCount: 2,
  },
  code: "FETCH_ERROR_001", // Can be anything since CodeType is unknown
  logLevel: "warn",
  cause: { timeout: true },
  responseMessage: "The server did not respond within the timeout limit.",
  name: "HttpTimeoutError",
};

export const serializeErrorReturnValue = {
  topLevel: {
    ...httpErrorConstructor,
    meta: { requestId: "abc123", timestamp: Date.now() },
    stack:
      "ExampleError: Something went wrong\n    at doSomething (/src/app.ts:42:13)\n    at main (/src/index.ts:10:5)",
  },
  causeChain: [
    {
      type: "ValidationError",
      field: "email",
      message: "Email format is invalid",
    },
    {
      type: "DatabaseError",
      query: "SELECT * FROM users WHERE id = ?",
      message: "Database connection timeout",
    },
  ],
};

export const errorResponse: ErrorResponse = {
  errorType: "Server",
  error: {
    message: "message",
    code: "code",
    name: "name",
  },
};
