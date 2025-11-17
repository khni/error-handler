/**
 * Defines the severity levels for logging.
 *
 * @public
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Interface for logger implementations.
 * Provides methods for logging at different severity levels.
 *
 * @public
 */
export interface ILogger {
  /**
   * Logs an error message.
   *
   * @param message - The error message to log
   * @param meta - Additional metadata for context
   */
  error(message: string, meta?: {}): void;

  /**
   * Logs a warning message.
   *
   * @param message - The warning message to log
   * @param meta - Additional metadata for context
   */
  warn(message: string, meta?: {}): void;

  /**
   * Logs an informational message.
   *
   * @param message - The info message to log
   * @param meta - Additional metadata for context
   */
  info(message: string, meta?: {}): void;

  /**
   * Logs a debug message.
   *
   * @param message - The debug message to log
   * @param meta - Additional metadata for context
   */
  debug(message: string, meta?: {}): void;
}

/**
 * Constructor parameters for creating a CustomError instance.
 *
 * @typeParam CodeType - The type of the error code
 *
 * @public
 */
export type CustomErrorConstructor<CodeType> = {
  /**
   * Human-readable error message.
   */
  message: string;

  /**
   * Name of the error class.
   */
  name: string;

  /**
   * Unique error code identifier.
   */
  code: CodeType;

  /**
   * Severity level for logging. Defaults to 'error'.
   *
   * @defaultValue 'error'
   */
  logLevel: LogLevel;

  /**
   * Additional metadata for debugging.
   */
  meta?: {};

  /**
   * The underlying cause of the error.
   */
  cause?: unknown;
};

/**
 * Constructor parameters for creating an HttpError instance.
 * Extends CustomErrorConstructor with HTTP-specific properties.
 *
 * @public
 */
export type HttpErrorConstructor = CustomErrorConstructor<unknown> & {
  /**
   * A sanitized message that can be safely returned to HTTP clients.
   * This should not contain sensitive internal information.
   */
  responseMessage: string;
};

/**
 * Represents a standardized error format for input validation failures.
 * Used when client input fails validation rules.
 *
 * @public
 */
export type InputValidationErrorType = {
  /**
   * A string identifier for the type of error.
   *
   * @example "ValidationError"
   * @example "IncorrectOtpError"
   * @example "AuthError"
   */
  name: string;

  /**
   * An array of error details. Each entry may represent a field-specific or general error.
   */
  errors: {
    /**
     * The name of the field that caused the error.
     * Omitted if the error is general (not tied to a specific field).
     *
     * @example "email"
     * @example "password"
     */
    field?: string;

    /**
     * One or more messages describing the error(s).
     *
     * @example ["Email is required", "Email must be valid"]
     */
    messages: string[];
  }[];
};

/**
 * Union type representing different error response formats.
 * Distinguishes between input validation errors and server errors.
 *
 * @typeParam CodeType - The type of the error code for server errors
 *
 * @public
 */
export type ErrorResponse<CodeType = unknown> =
  | {
      /**
       * Input validation error response.
       */
      errorType: "InputValidation";
      error: InputValidationErrorType;
    }
  | {
      /**
       * Server error response.
       */
      errorType: "Server";
      error: {
        /**
         * Name of the error.
         */
        name: string;

        /**
         * Human-readable error message.
         */
        message: string;

        /**
         * Unique error code identifier.
         */
        code: CodeType;
      };
    };
