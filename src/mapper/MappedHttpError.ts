import { HttpError } from "../errors/HttpError.js";

/**
 * Concrete implementation of HttpError specifically for error mapping scenarios.
 * This class ensures that mapped errors maintain all the properties of the original
 * CustomError while adding HTTP-specific context.
 *
 * @public
 *
 * @example
 * ```typescript
 * // Direct usage (usually created via errorMapper)
 * const httpError = new MappedHttpError({
 *   statusCode: 404,
 *   responseMessage: 'Resource not found',
 *   name: 'NotFoundError',
 *   message: 'User with ID 123 not found in database',
 *   code: 'USER_NOT_FOUND',
 *   logLevel: 'warn',
 *   meta: { userId: '123' },
 *   cause: originalError
 * });
 * ```
 *
 * @remarks
 * This class extends HttpError and provides:
 * - Proper prototype chain preservation
 * - All HttpError functionality
 * - Type-safe construction
 * - Compatibility with error handling middleware
 */
export class MappedHttpError extends HttpError {
  /**
   * The HTTP status code for this error
   */
  public statusCode: number;

  /**
   * Creates a new MappedHttpError instance
   *
   * @param params - Configuration parameters for the HTTP error
   * @param statusCode - HTTP status code (400, 404, 500, etc.)
   * @param responseMessage - Client-safe error message
   * @param name - Error class name
   * @param message - Internal error message for logging
   * @param code - Original error code from CustomError
   * @param logLevel - Log level for error reporting
   * @param meta - Additional metadata for debugging
   * @param cause - Original error that caused this mapped error
   */
  constructor(params: HttpError & { statusCode: number }) {
    super(params);
    this.statusCode = params.statusCode;
  }
}
