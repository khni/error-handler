import { MiddlewareHandler } from "hono";
import { ILogger } from "../../errors/types.js";
import { HttpErrorSerializer } from "../../serializers/HttpErrorSerializer.js";
import { FallbackErrorStrategy } from "../strategies/FallBackErrorHandlerStrategy.js";
import { HttpErrorHandlerStrategy } from "../strategies/HttpErrorHandlerStrategy.js";
import { InputValidationErrorHandlerStrategy } from "../strategies/InputValidationErrorHandlerStrategy.js";
import { HonoErrorHandler } from "./handler.js";

/**
 * Creates a comprehensive error handler for Hono.js applications.
 * This factory creates error handling strategies for Hono using the chain of responsibility pattern.
 *
 * @param logger - Optional logger instance for error logging. If provided, errors will be
 *                logged according to their log levels. If not provided, errors will still
 *                be handled but not logged.
 *
 * @returns A HonoErrorHandler instance that can be used as middleware, error handler, or manual handler
 *
 * @public
 *
 * @example
 * ```typescript
 * import { Hono } from 'hono';
 * import { createHonoErrorHandler } from './errors/handlers/honoErrorHandlerFactory.js';
 *
 * // Create Hono app
 * const app = new Hono();
 *
 * // Create error handler with optional logger
 * const errorHandler = createHonoErrorHandler();
 *
 * // Option 1: Use as global error handler (catches unhandled errors)
 * app.onError(errorHandler.handler());
 *
 * // Option 2: Use as middleware (catches errors in request pipeline)
 * app.use(errorHandler.middleware());
 * ```
 *
 * @example
 * ```typescript
 * // Complete Hono setup with custom logger
 * import { Hono } from 'hono';
 * import { createHonoErrorHandler } from './errors/handlers/honoErrorHandlerFactory.js';
 * import { ILogger } from './errors/types.js';
 *
 * class ConsoleLogger implements ILogger {
 *   error(message: string, meta?: {}) {
 *     console.error(`[ERROR] ${message}`, meta);
 *   }
 *   warn(message: string, meta?: {}) {
 *     console.warn(`[WARN] ${message}`, meta);
 *   }
 *   info(message: string, meta?: {}) {
 *     console.info(`[INFO] ${message}`, meta);
 *   }
 *   debug(message: string, meta?: {}) {
 *     console.debug(`[DEBUG] ${message}`, meta);
 *   }
 * }
 *
 * const app = new Hono();
 * const logger = new ConsoleLogger();
 *
 * // Create error handler with logger
 * const errorHandler = createHonoErrorHandler(logger);
 *
 * // Add error handling middleware
 * app.use(errorHandler.middleware());
 *
 * // Application routes
 * app.get('/users/:id', (c) => {
 *   // Your route logic here
 *   // Errors will be caught by the middleware
 * });
 *
 * // Or use as onError handler instead of middleware
 * // app.onError(errorHandler.handler());
 *
 * // Start server
 * export default app;
 * ```
 *
 * @example
 * ```typescript
 * // Manual error handling in routes
 * import { Hono } from 'hono';
 * import { createHonoErrorHandler } from './errors/handlers/honoErrorHandlerFactory.js';
 * import { InputValidationError } from './errors/InputValidationError.js';
 *
 * const app = new Hono();
 * const errorHandler = createHonoErrorHandler();
 *
 * app.post('/users', async (c) => {
 *   try {
 *     const data = await c.req.json();
 *
 *     if (!data.email) {
 *       throw new InputValidationError('Email is required', { field: 'email' });
 *     }
 *
 *     // Process data
 *     return c.json({ success: true }, 201);
 *   } catch (err) {
 *     // Manual error handling
 *     return errorHandler.handleError(
 *       err instanceof Error ? err : new Error(String(err)),
 *       c
 *     );
 *   }
 * });
 * ```
 *
 * @remarks
 * The error handler uses the following strategy chain:
 * 1. **HttpErrorHandlerStrategy** - Handles `HttpError` instances with proper status codes and serialization
 * 2. **InputValidationErrorHandlerStrategy** - Handles `InputValidationError` instances with 400 status
 * 3. **FallbackErrorStrategy** - Catches any unhandled errors and returns a generic 500 response
 *
 * Each strategy in the chain is tried in order until one handles the error.
 *
 * @see {@link HonoErrorHandler} for available methods (handler(), middleware(), handleError())
 * @see {@link HttpErrorHandlerStrategy} for HTTP error handling
 * @see {@link InputValidationErrorHandlerStrategy} for validation error handling
 * @see {@link FallbackErrorStrategy} for unhandled error fallback
 * @see {@link HttpErrorSerializer} for HTTP error response serialization
 */
export const createHonoErrorHandler = (logger?: ILogger): MiddlewareHandler => {
  return new HonoErrorHandler([
    new HttpErrorHandlerStrategy(new HttpErrorSerializer(), logger),
    new InputValidationErrorHandlerStrategy(logger),
    new FallbackErrorStrategy(logger),
  ]).middleware();
};
