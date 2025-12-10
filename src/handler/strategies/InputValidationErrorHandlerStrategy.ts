import { IErrorHandlingStrategy } from "./interfaces/IErrorHandlingStrategy.js";
import { ErrorResponse, ILogger } from "../../errors/types.js";
import { InputValidationError } from "../../errors/input-validation/InputValidationError.js";

/**
 * Handles input validation errors with standardized 400 responses.
 * This strategy processes InputValidationError instances from validation failures.
 *
 * @public
 *
 * @remarks
 * This strategy:
 * - Handles InputValidationError instances from validation failures
 * - Returns 400 Bad Request status code
 * - Preserves structured validation error details for client feedback
 * - Logs validation failures as warnings
 *
 * @example
 * ```typescript
 * const validationStrategy = new InputValidationErrorHandlerStrategy(logger);
 *
 * // Handles errors from:
 * // - Zod validation failures
 * // - Custom validation logic
 * // - Data transformation errors
 *
 * // Example usage:
 * try {
 *   // ... some operation that might throw
 * } catch (error) {
 *   if (validationStrategy.canHandle(error)) {
 *     const result = validationStrategy.handle(error);
 *     // result contains { status: 400, response: object }
 *   }
 * }
 * ```
 */
export class InputValidationErrorHandlerStrategy
  implements IErrorHandlingStrategy
{
  /**
   * Creates a new InputValidationErrorHandlerStrategy instance
   *
   * @param logger - Optional logger for validation error logging
   */
  constructor(private logger?: ILogger) {}

  /**
   * Determines if this strategy can handle the error.
   *
   * @param err - The error to check
   * @returns True if the error is an instance of InputValidationError
   */
  canHandle(err: Error): boolean {
    return err instanceof InputValidationError;
  }

  /**
   * Handles input validation errors by logging and returning structured 400 responses.
   *
   * @param err - The InputValidationError to handle
   * @returns Object containing status code (400) and serialized validation error response
   *
   * @example
   * ```typescript
   * // Example validation error response:
   * {
   *   status: 400,
   *   response: {
   *     "errorType": "InputValidation",
   *     "error": {
   *       "name": "ValidationError",
   *       "errors": [
   *         {
   *           "field": "email",
   *           "messages": ["Invalid email format"]
   *         }
   *       ]
   *     }
   *   }
   * }
   * ```
   */
  handle(err: Error): { status: number; response: object } {
    const error = err as InputValidationError;

    // Log validation failures as warnings
    if (this.logger) {
      this.logger.warn("InputValidationError", error);
    }

    // Return structured validation error response
    const inputValidationError: ErrorResponse<unknown> = {
      errorType: "InputValidation",
      error,
    };

    return {
      status: 400,
      response: inputValidationError,
    };
  }
}
