import { Response } from "express";

/**
 * Defines the contract for error handling strategies in the error handling system.
 * This interface follows the Strategy Pattern, allowing different error types to be
 * handled by specialized strategies in a chain of responsibility.
 *
 * @public
 *
 * @example
 * ```typescript
 * // Implementing a custom error handling strategy
 * class MyCustomErrorStrategy implements IErrorHandlingStrategy {
 *   canHandle(err: Error): boolean {
 *     return err instanceof MyCustomError;
 *   }
 *
 *   handle(err: Error, res: Response): void {
 *     const customError = err as MyCustomError;
 *     res.status(customError.statusCode).json({
 *       errorType: "Custom",
 *       error: customError.toClientFormat()
 *     });
 *   }
 * }
 *
 * // Using with ErrorHandler
 * const errorHandler = new ErrorHandler([
 *   new HttpErrorHandlerStrategy(/* ... *\/),
 *   new MyCustomErrorStrategy(), // Your custom strategy
 *   new FallbackErrorStrategy(/* ... *\/)
 * ]);
 * ```
 *
 * @remarks
 * The error handling system uses this interface to implement a chain of responsibility:
 * 1. Each strategy tests if it can handle an error via `canHandle()`
 * 2. The first strategy that returns `true` handles the error via `handle()`
 * 3. This allows for clean separation of concerns between different error types
 *
 * @see {@link ErrorHandler} for the main coordinator that uses strategies
 * @see {@link HttpErrorHandlerStrategy} for HTTP error handling
 * @see {@link InputValidationErrorHandlerStrategy} for validation error handling
 * @see {@link FallbackErrorStrategy} for unhandled error fallback
 */
export interface IErrorHandlingStrategy {
  /**
   * Determines whether this strategy can handle the given error.
   * This method should perform a quick type check or condition validation
   * to decide if this strategy is appropriate for the error.
   *
   * @param err - The error to evaluate
   * @returns `true` if this strategy can handle the error, `false` otherwise
   *
   * @example
   * ```typescript
   * // Example implementations:
   *
   * // Type-based handling
   * canHandle(err: Error): boolean {
   *   return err instanceof HttpError;
   * }
   *
   * // Condition-based handling
   * canHandle(err: Error): boolean {
   *   return err.message.includes("Validation");
   * }
   *
   * // Multiple condition handling
   * canHandle(err: Error): boolean {
   *   return err instanceof DatabaseError &&
   *          err.code === 'CONNECTION_TIMEOUT';
   * }
   * ```
   */
  canHandle(err: Error): boolean;

  /**
   * Handles the error by sending an appropriate HTTP response.
   * This method should:
   * - Format the error for client consumption
   * - Set appropriate HTTP status code
   * - Send a consistent JSON response structure
   * - Optionally log the error for debugging
   *
   * @param err - The error to handle (guaranteed to pass canHandle check)
   * @param res - Express Response object for sending the HTTP response
   *
   * @example
   * ```typescript
   * // Example implementation for HTTP errors
   * handle(err: Error, res: Response): void {
   *   const httpError = err as HttpError;
   *
   *   // Log with appropriate level
   *   logger[httpError.logLevel]('HTTP Error', httpError);
   *
   *   // Send formatted response
   *   res.status(httpError.statusCode).json({
   *     errorType: "Server",
   *     error: {
   *       name: httpError.name,
   *       message: httpError.responseMessage,
   *       code: httpError.code
   *     }
   *   });
   * }
   *
   * // Example implementation for validation errors
   * handle(err: Error, res: Response): void {
   *   const validationError = err as InputValidationError;
   *
   *   logger.warn('Validation failed', validationError);
   *
   *   res.status(400).json({
   *     errorType: "InputValidation",
   *     error: validationError.toJSON()
   *   });
   * }
   * ```
   *
   * @remarks
   * The handle method should:
   * - Never throw exceptions (handle errors gracefully)
   * - Always send a response to the client
   * - Use consistent error response formats
   * - Consider security (don't expose sensitive error details)
   */
  handle(err: Error, res: Response): void;
}
