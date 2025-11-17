import type { NextFunction, Response, Request } from "express";
import { IErrorHandlingStrategy } from "./interfaces/IErrorHandlingStrategy.js";

/**
 * Main error handler that implements the Chain of Responsibility pattern.
 * Delegates error handling to specialized strategies based on error type.
 *
 * @public
 *
 * @example
 * ```typescript
 * const errorHandler = new ErrorHandler([
 *   new HttpErrorHandlerStrategy(serializer, logger),
 *   new InputValidationErrorHandlerStrategy(logger),
 *   new FallbackErrorStrategy(logger)
 * ]);
 *
 * // Use in Express
 * app.use(errorHandler.handle);
 * ```
 */
export class ErrorHandler {
  /**
   * Creates a new ErrorHandler instance with the provided strategies.
   * Strategies are evaluated in order until one can handle the error.
   *
   * @param strategies - Array of error handling strategies to use
   */
  constructor(private strategies: IErrorHandlingStrategy[]) {}

  /**
   * Express.js error handling middleware function.
   * Processes errors through the strategy chain and sends appropriate responses.
   *
   * @param err - The error to handle
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function (not used in final error handler)
   *
   * @example
   * ```typescript
   * // Throwing errors that will be handled by the strategy chain
   * app.get('/users/:id', (req, res, next) => {
   *   if (!isValidId(req.params.id)) {
   *     throw new Inpuimport type { NextFunction, Response, Request } from "express";

import { IErrorHandlingStrategy } from "./interfaces/IErrorHandlingStrategy.js";

export class ErrorHandler {
  constructor(private strategies: IErrorHandlingStrategy[]) {}

  public handle = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    const strategy = this.strategies.find((s) => s.canHandle(err));

    if (strategy) {
      strategy.handle(err, res);
    } else {
      // Optional: If no strategy found (shouldn't happen if Fallback is included)

      res.status(500).json({
        code: "UNKNOWN_ERROR",
        message: "An Expected error occurred.",
        name: "unknown",
      });
    }
  };
}
tValidationError(/* ... *\/);
   *   }
   *
   *   if (!userExists(req.params.id)) {
   *     throw new NotFoundError(/* ... *\/);
   *   }
   *
   *   // Business logic...
   * });
   *
   * app.use(errorHandler.handle);
   * ```
   */
  public handle = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    const strategy = this.strategies.find((s) => s.canHandle(err));

    if (strategy) {
      strategy.handle(err, res);
    } else {
      // Fallback for unexpected cases (should not occur with FallbackErrorStrategy)
      res.status(500).json({
        code: "UNKNOWN_ERROR",
        message: "An Expected error occurred.",
        name: "unknown",
      });
    }
  };
}
