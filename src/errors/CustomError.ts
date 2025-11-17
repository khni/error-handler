import { CustomErrorConstructor, LogLevel } from "./types.js";

/**
 * A custom error class that extends the native JavaScript Error class.
 * Provides additional properties for error handling and logging.
 *
 * @typeParam CodeType - The type of the error code (string, number, enum, etc.)
 *
 * @public
 */
export abstract class CustomError<CodeType> extends Error {
  /**
   * A unique identifier code for the error type.
   */
  public code: CodeType;

  /**
   * The log level at which this error should be recorded.
   */
  public logLevel: LogLevel;

  /**
   * Additional metadata associated with the error.
   */
  public meta?: {};

  /**
   * The human-readable error message.
   */
  public message: string;

  /**
   * Creates a new instance of CustomError.
   *
   * @param constructorParams - Configuration object for the error
   * @param name - The name of the error class
   * @param message - Human-readable error message
   * @param meta - Additional metadata for debugging
   * @param code - Unique error code identifier
   * @param logLevel - Severity level for logging
   * @param cause - The underlying cause of the error
   *
   * @example
   * ```typescript
   * class MyCustomError extends CustomError<'INVALID_INPUT'> {
   *   constructor(params: Omit<CustomErrorConstructor<'INVALID_INPUT'>, 'name'>) {
   *     super({ ...params, name: 'MyCustomError' });
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
  }: CustomErrorConstructor<CodeType> & { name: string }) {
    super(message);

    this.name = name;
    this.message = message;
    this.meta = meta;
    this.code = code;
    this.logLevel = logLevel;
    this.cause = cause;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
