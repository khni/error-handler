import { IErrorHandlingStrategy } from "./interfaces/IErrorHandlingStrategy.js";
import { ErrorResponse, ILogger } from "../../errors/types.js";

/**
 * Fallback error strategy that handles any error not caught by previous strategies.
 * This should always be the last strategy in the error handling chain.
 *
 * @public
 *
 * @remarks
 * This strategy:
 * - Always returns `true` for `canHandle` (acts as catch-all)
 * - Logs unexpected errors for debugging
 * - Returns a generic 500 Internal Server Error response
 * - Ensures no error goes unhandled
 * - Can be used with any HTTP framework or serverless environment
 *
 * @example
 * ```typescript
 * // Always include as the last strategy

 * // Example usage:
 * try {
 *   // ... some operation that might throw
 * } catch (error) {
 *   // Process through strategies until one can handle it
 *   for (const strategy of strategies) {
 *     if (strategy.canHandle(error)) {
 *       const result = strategy.handle(error);
 *       // result contains { status: number, response: object }
 *       break;
 *     }
 *   }
 * }
 * ```
 */
export class FallbackErrorStrategy implements IErrorHandlingStrategy {
  /**
   * Creates a new FallbackErrorStrategy instance
   *
   * @param logger - Optional logger for recording unexpected errors
   */
  constructor(private logger?: ILogger) {}

  /**
   * Determines if this strategy can handle the error.
   * Since this is the fallback strategy, it always returns true.
   *
   * @param err - The error to check
   * @returns Always returns true
   */
  canHandle(err: Error): boolean {
    return true; // Always applies if no other strategy does
  }

  /**
   * Logs unexpected errors with detailed information for debugging.
   *
   * @param error - The unexpected error to log
   * @public for testing purposes
   */
  log = (error: any) => {
    if (this.logger) {
      this.logger.error("UnexpectedError" + error.name, {
        topLevel: {
          name: error.name,
          message: error.message,
          code: error.code,
          meta: error.meta,
          stack: error.stack,
        },
      });
    }
  };

  /**
   * Handles unexpected errors by logging and returning a generic 500 response.
   *
   * @param err - The unexpected error
   * @returns Object containing status code (500) and generic error response
   *
   * @example
   * ```typescript
   * // This strategy handles any error that reaches it:
   * // - Programming errors
   * // - Third-party library errors
   * // - Database connection errors
   * // - Any unanticipated error types
   *
   * // Example response:
   * {
   *   status: 500,
   *   response: {
   *     errorType: "Server",
   *     error: {
   *       code: "UNKNOWN_ERROR",
   *       message: "An Expected error occurred.",
   *       name: "unknown",
   *     }
   *   }
   * }
   * ```
   */
  handle(err: Error) {
    this.log(err);
    const error: ErrorResponse<unknown> = {
      errorType: "Server",
      error: {
        code: "UNKNOWN_ERROR",
        message: "An Expected error occurred.",
        name: "unknown",
      },
    };

    return {
      status: 500,
      response: error,
    };
  }
}
