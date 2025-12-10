import type { Context, Next } from "hono";
import { IErrorHandlingStrategy } from "../strategies/interfaces/IErrorHandlingStrategy.js";
import { ContentfulStatusCode } from "hono/utils/http-status";

/**
 * Hono-specific error handler that implements the Chain of Responsibility pattern.
 * Delegates error processing to strategies and sends appropriate HTTP responses.
 *
 * @public
 *
 * @remarks
 * This handler:
 * - Processes errors through a chain of specialized strategies
 * - Uses strategies to determine error type and get response data
 * - Sends HTTP responses via Hono's context object
 * - Can be used as middleware or error handler in Hono applications
 * - Includes a final fallback for unhandled errors
 *
 * @example
 * ```typescript
 * import { Hono } from 'hono';
 * import { HonoErrorHandler } from './errors/handlers/HonoErrorHandler.js';
 * import { HttpErrorHandlerStrategy } from './errors/handlers/HttpErrorHandlerStrategy.js';
 * import { InputValidationErrorHandlerStrategy } from './errors/handlers/InputValidationErrorHandlerStrategy.js';
 * import { FallbackErrorStrategy } from './errors/handlers/FallbackErrorStrategy.js';
 *
 * // Create strategies
 * const strategies = [
 *   new HttpErrorHandlerStrategy(serializer, logger),
 *   new InputValidationErrorHandlerStrategy(logger),
 *   new FallbackErrorStrategy(logger)
 * ];
 *
 * // Create Hono error handler
 * const honoErrorHandler = new HonoErrorHandler(strategies);
 *
 * // Create Hono app and use the error handler
 * const app = new Hono();
 *
 * // Option 1: Use as middleware (catches errors in routes)
 * app.use(honoErrorHandler.middleware());
 *
 * // Option 2: Use as onError handler (catches unhandled errors)
 * app.onError(honoErrorHandler.handler());
 *
 * // Define routes
 * app.get('/users/:id', (c) => {
 *   // Route logic that might throw errors
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Throwing errors in Hono routes
 * app.post('/users', async (c) => {
 *   const data = await c.req.json();
 *
 *   if (!isValidUserData(data)) {
 *     throw new InputValidationError('Invalid user data', { data });
 *   }
 *
 *   if (!isAuthorized(c)) {
 *     throw new UnauthorizedError('User not authorized');
 *   }
 *
 *   // Business logic...
 * });
 * ```
 */
export class HonoErrorHandler {
  /**
   * Creates a new HonoErrorHandler instance with the provided strategies.
   * Strategies are evaluated in order until one can handle the error.
   *
   * @param strategies - Array of error handling strategies to use.
   *                     Strategies must implement `handle(err): { status: number; response: object }`
   */
  constructor(private strategies: IErrorHandlingStrategy[]) {}

  /**
   * Creates a Hono error handler function compatible with `app.onError()`.
   *
   * @returns A function that can be used with `app.onError()`
   *
   * @example
   * ```typescript
   * const app = new Hono();
   * const errorHandler = new HonoErrorHandler(strategies);
   * app.onError(errorHandler.handler());
   * ```
   */
  handler(): (err: Error, c: Context) => Response | Promise<Response> {
    return (err: Error, c: Context): Response | Promise<Response> => {
      // Find the first strategy that can handle this error
      const strategy = this.strategies.find((s) => s.canHandle(err));

      if (strategy) {
        // Get status code and response data from the strategy
        const { status, response } = strategy.handle(err);

        // Return the HTTP response via Hono
        return c.json(response, status as ContentfulStatusCode);
      } else {
        // Fallback for unexpected cases (should not occur if FallbackErrorStrategy is included)
        return c.json(
          {
            errorType: "Server",
            error: {
              code: "UNKNOWN_ERROR",
              message: "An unexpected error occurred.",
              name: "unknown",
            },
          },
          500
        );
      }
    };
  }

  /**
   * Creates a Hono middleware function that catches and handles errors.
   *
   * @returns A middleware function that catches errors in the request pipeline
   *
   * @example
   * ```typescript
   * const app = new Hono();
   * const errorHandler = new HonoErrorHandler(strategies);
   * app.use(errorHandler.middleware());
   *
   * // All routes after this middleware will have errors caught
   * app.get('/users', (c) => { ... });
   * ```
   */
  middleware(): (c: Context, next: Next) => Promise<void | Response> {
    return async (c: Context, next: Next): Promise<void | Response> => {
      try {
        await next();
      } catch (err) {
        // Ensure it's an Error instance
        const error = err instanceof Error ? err : new Error(String(err));

        // Find the first strategy that can handle this error
        const strategy = this.strategies.find((s) => s.canHandle(error));

        if (strategy) {
          // Get status code and response data from the strategy
          const { status, response } = strategy.handle(error);

          // Return the HTTP response via Hono
          return c.json(response, status as ContentfulStatusCode);
        } else {
          // Fallback for unexpected cases
          return c.json(
            {
              errorType: "Server",
              error: {
                code: "UNKNOWN_ERROR",
                message: "An unexpected error occurred.",
                name: "unknown",
              },
            },
            500
          );
        }
      }
    };
  }

  /**
   * Direct error handling method that can be called manually.
   * Useful for manual error handling in try-catch blocks within routes.
   *
   * @param err - The error to handle
   * @param c - Hono context object
   * @returns Response object to be returned from the route
   *
   * @example
   * ```typescript
   * app.post('/data', async (c) => {
   *   try {
   *     // Some operation that might fail
   *     const result = await riskyOperation();
   *     return c.json(result, 200);
   *   } catch (err) {
   *     // Manual error handling
   *     return errorHandler.handleError(err, c);
   *   }
   * });
   * ```
   */
  handleError(err: Error, c: Context): Response {
    // Find the first strategy that can handle this error
    const strategy = this.strategies.find((s) => s.canHandle(err));

    if (strategy) {
      // Get status code and response data from the strategy
      const { status, response } = strategy.handle(err);

      // Return the HTTP response via Hono
      return c.json(response, status as ContentfulStatusCode);
    } else {
      // Fallback for unexpected cases
      return c.json(
        {
          errorType: "Server",
          error: {
            code: "UNKNOWN_ERROR",
            message: "An unexpected error occurred.",
            name: "unknown",
          },
        },
        500
      );
    }
  }
}
