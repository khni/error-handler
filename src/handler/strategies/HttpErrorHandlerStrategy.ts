import { IErrorHandlingStrategy } from "./interfaces/IErrorHandlingStrategy.js";
import { HttpError } from "../../errors/HttpError.js";
import { ILogger } from "../../errors/types.js";
import { IHttpErrorSerializer } from "../../serializers/interfaces/IHttpErrorSerializer.js";

/**
 * Handles HttpError instances by logging and returning structured error data.
 * This strategy processes errors that extend the HttpError base class.
 *
 * @public
 *
 * @remarks
 * This strategy:
 * - Processes errors that extend the HttpError base class
 * - Returns the error's status code and serialized response
 * - Respects the error's logLevel for appropriate logging
 * - Can be used with any HTTP framework or serverless environment
 *
 * @example
 * ```typescript
 * const httpStrategy = new HttpErrorHandlerStrategy(
 *   new HttpErrorSerializer(),
 *   logger
 * );
 *
 * // Example usage:
 * try {
 *   // ... some operation that might throw
 * } catch (error) {
 *   if (httpStrategy.canHandle(error)) {
 *     const result = httpStrategy.handle(error);
 *     // result contains { status: number, response: object }
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Handles errors like:
 * // - NotFoundError (404)
 * // - BadRequestError (400)
 * // - UnauthorizedError (401)
 * // - InternalServerError (500)
 * ```
 */
export class HttpErrorHandlerStrategy implements IErrorHandlingStrategy {
  /**
   * Creates a new HttpErrorHandlerStrategy instance
   *
   * @param httpErrorSerializer - Serializer for HTTP error responses
   * @param logger - Optional logger for error logging
   */
  constructor(
    private httpErrorSerializer: IHttpErrorSerializer,
    private logger?: ILogger
  ) {}

  /**
   * Determines if this strategy can handle the error.
   *
   * @param err - The error to check
   * @returns True if the error is an instance of HttpError
   */
  canHandle(err: Error): boolean {
    return err instanceof HttpError;
  }

  /**
   * Handles HttpError instances by logging and returning structured error data.
   *
   * @param err - The HttpError to handle
   * @returns Object containing status code and serialized response
   *
   * @example
   * ```typescript
   * // Example error flow:
   * throw new NotFoundError('User', { userId: '123' });
   *
   * // This strategy will:
   * // 1. Log with 'info' level (based on error.logLevel)
   * // 2. Return { status: 404, response: { ...serialized error... } }
   * ```
   */
  handle(err: Error): { status: number; response: object } {
    const error = err as HttpError;

    // Log with appropriate level from the error
    if (this.logger) {
      this.logger[error.logLevel](
        "HttpError",
        this.httpErrorSerializer.serializerError(error)
      );
    }

    // Return status code and serialized error response
    return {
      status: error.statusCode,
      response: this.httpErrorSerializer.serializeResponse(error),
    };
  }
}
