import { Response } from "express";
import { IErrorHandlingStrategy } from "./interfaces/IErrorHandlingStrategy.js";
import { ErrorResponse, ILogger } from "../errors/types.js";

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
 *
 * @example
 * ```typescript
 * // Always include as the last strategy
 * const strategies = [
 *   new HttpErrorHandlerStrategy(/* ... *\/),
 *   new InputValidationErrorHandlerStrategy(/* ... *\/),
 *   new FallbackErrorStrategy(logger) // Last in chain
 * ];
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
   *
   *
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
   * @param res - Express response object
   *
   * @example
   * ```typescript
   * // This strategy handles any error that reaches it:
   * // - Programming errors
   * // - Third-party library errors
   * // - Database connection errors
   * // - Any unanticipated error types
   * ```
   */
  handle(err: Error, res: Response): void {
    this.log(err);
    const error: ErrorResponse<unknown> = {
      errorType: "Server",
      error: {
        code: "UNKNOWN_ERROR",
        message: "An Expected error occurred.",
        name: "unknown",
      },
    };
    res.status(500).json(error);
  }
}
