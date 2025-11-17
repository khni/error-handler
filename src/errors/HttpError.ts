import { HttpErrorConstructor, LogLevel } from "./types.js";

/**
 * An abstract base class for HTTP-related errors.
 * Extends the native Error class with HTTP-specific properties.
 *
 * @public
 */
export abstract class HttpError extends Error {
  /**
   * The HTTP status code associated with this error.
   * Must be implemented by concrete subclasses.
   *
   * @example
   * ```typescript
   * statusCode = 404;
   * ```
   */
  abstract statusCode: number;

  /**
   * A unique identifier code for the error type.
   */
  public code: unknown;

  /**
   * The log level at which this error should be recorded.
   */
  public logLevel: LogLevel;

  /**
   * Additional metadata associated with the error.
   */
  public meta?: {};

  /**
   * A sanitized message that can be safely returned to clients.
   * This message should not expose sensitive internal information.
   */
  public responseMessage: string;

  /**
   * Creates a new instance of HttpError.
   *
   * @param params - Configuration object for the HTTP error
   * @param name - The name of the error class
   * @param message - Internal error message for logging
   * @param responseMessage - Safe message for client responses
   * @param meta - Additional metadata for debugging
   * @param code - Unique error code identifier
   * @param logLevel - Severity level for logging
   * @param cause - The underlying cause of the error
   *
   * @example
   * ```typescript
   * class NotFoundError extends HttpError {
   *   statusCode = 404;
   *
   *   constructor(message: string, resource: string) {
   *     super({
   *       name: 'NotFoundError',
   *       message,
   *       responseMessage: `${resource} not found`,
   *       code: 'RESOURCE_NOT_FOUND',
   *       logLevel: 'warn'
   *     });
   *   }
   * }
   * ```
   */
  constructor({
    name,
    message,
    meta,
    code,
    logLevel,
    cause,
    responseMessage,
  }: HttpErrorConstructor & { responseMessage: string }) {
    super(message);
    this.name = name;
    this.message = message;
    this.meta = meta;
    this.code = code;
    this.logLevel = logLevel;
    this.cause = cause;
    this.responseMessage = responseMessage;

    Object.setPrototypeOf(this, new.target.prototype); // preserve prototype chain
  }
}
