import type { NextFunction, Response, Request } from "express";
import { IErrorHandlingStrategy } from "../strategies/interfaces/IErrorHandlingStrategy.js";

/**
 * Express-specific error handler that implements the Chain of Responsibility pattern.
 * Delegates error processing to strategies and sends appropriate HTTP responses.
 *
 * @public
 *
 * @remarks
 * This handler:
 * - Processes errors through a chain of specialized strategies
 * - Uses strategies to determine error type and get response data
 * - Sends HTTP responses via Express based on strategy results
 * - Includes a final fallback for unhandled errors
 *
 * @example
 * ```typescript
 * // Create strategies (now returning data instead of sending responses)
 * const httpStrategy = new HttpErrorHandlerStrategy(serializer, logger);
 * const validationStrategy = new InputValidationErrorHandlerStrategy(logger);
 * const fallbackStrategy = new FallbackErrorStrategy(logger);
 *
 * // Create Express error handler
 * const expressErrorHandler = new ExpressErrorHandler([
 *   httpStrategy,
 *   validationStrategy,
 *   fallbackStrategy
 * ]);
 *
 * // Use in Express app
 * app.use(expressErrorHandler.handle);
 * ```
 *
 * @example
 * ```typescript
 * // Throwing errors that will be handled by the strategy chain
 * app.get('/users/:id', (req, res, next) => {
 *   if (!isValidId(req.params.id)) {
 *     throw new InputValidationError(/* ... *\/);
 *   }
 *
 *   if (!userExists(req.params.id)) {
 *     throw new NotFoundError(/* ... *\/);
 *   }
 *
 *   // Business logic...
 * });
 * ```
 */
export class ExpressErrorHandler {
  /**
   * Creates a new ExpressErrorHandler instance with the provided strategies.
   * Strategies are evaluated in order until one can handle the error.
   *
   * @param strategies - Array of error handling strategies to use.
   *                     Strategies must implement `handle(err): { status: number; response: object }`
   */
  constructor(private strategies: IErrorHandlingStrategy[]) {}

  /**
   * Express.js error handling middleware function.
   * Processes errors through the strategy chain, gets response data, and sends HTTP response.
   *
   * @param err - The error to handle
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function (not used in final error handler)
   *
   * @returns void - Sends HTTP response via Express
   *
   * @remarks
   * The handler:
   * 1. Finds the first strategy that can handle the error
   * 2. Gets status code and response data from the strategy
   * 3. Sends the HTTP response with appropriate status and JSON body
   * 4. Falls back to a generic 500 error if no strategy is found (should not occur with proper configuration)
   */
  public handle = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    // Find the first strategy that can handle this error
    const strategy = this.strategies.find((s) => s.canHandle(err));

    if (strategy) {
      // Get status code and response data from the strategy
      const { status, response } = strategy.handle(err);

      // Send the HTTP response via Express
      res.status(status).json(response);
    } else {
      // Fallback for unexpected cases (should not occur if FallbackErrorStrategy is included)
      // This provides extra safety in case of misconfiguration
      res.status(500).json({
        errorType: "Server",
        error: {
          code: "UNKNOWN_ERROR",
          message: "An unexpected error occurred.",
          name: "unknown",
        },
      });
    }
  };
}
