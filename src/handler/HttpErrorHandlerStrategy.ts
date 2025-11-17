import type { Response } from "express";
import { IErrorHandlingStrategy } from "./interfaces/IErrorHandlingStrategy.js";
import { HttpError } from "../errors/HttpError.js";
import { ILogger } from "../errors/types.js";
import { IHttpErrorSerializer } from "../serializers/interfaces/IHttpErrorSerializer.js";

/**
 * Strategy for handling HttpError instances with proper status codes and serialization.
 *
 * @public
 *
 * @remarks
 * This strategy:
 * - Handles errors that extend the HttpError base class
 * - Uses the error's statusCode property for HTTP responses
 * - Serializes errors for both logging and client responses
 * - Respects the error's logLevel for appropriate logging
 *
 * @example
 * ```typescript
 * const httpStrategy = new HttpErrorHandlerStrategy(
 *   new HttpErrorSerializer(),
 *   logger
 * );
 *
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
   * Handles HttpError instances by logging and sending formatted responses.
   *
   * @param err - The HttpError to handle
   * @param res - Express response object
   *
   * @example
   * ```typescript
   * // Example error flow:
   * throw new NotFoundError('User', { userId: '123' });
   *
   * // This strategy will:
   * // 1. Log with 'info' level (based on error.logLevel)
   * // 2. Return 404 status code
   * // 3. Send client-safe error response
   * ```
   */
  handle(err: Error, res: Response): void {
    const error = err as HttpError;

    // Log with appropriate level from the error
    if (this.logger) {
      this.logger[error.logLevel](
        "HttpError",
        this.httpErrorSerializer.serializerError(error)
      );
    }

    // Send response with proper status code and serialized error
    res
      .status(error.statusCode)
      .json(this.httpErrorSerializer.serializeResponse(error));
  }
}
