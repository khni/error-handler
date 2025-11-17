import { ILogger } from "../errors/types.js";
import { HttpErrorSerializer } from "../serializers/HttpErrorSerializer.js";
import { ErrorHandler } from "./ErrorHandlerContext.js";
import { FallbackErrorStrategy } from "./FallBackErrorHandlerStrategy.js";
import { HttpErrorHandlerStrategy } from "./HttpErrorHandlerStrategy.js";
import { InputValidationErrorHandlerStrategy } from "./InputValidationErrorHandlerStrategy.js";

/**
 * Creates a comprehensive error handling middleware for Express.js applications.
 * This middleware uses a chain of responsibility pattern to handle different error types
 * with appropriate strategies and serializers.
 *
 * @param logger - Optional logger instance for error logging. If provided, errors will be
 *                logged according to their log levels. If not provided, errors will still
 *                be handled but not logged.
 *
 * @returns An Express.js error handling middleware function that can be used with `app.use()`
 *
 * @public
 *
 * @example
 * ```typescript
 * // Basic usage with default logging (no logger provided)
 * import { createErrHandlerMiddleware } from './middleware/errorHandler.js';
 *
 * app.use(createErrHandlerMiddleware());
 *
 * // Usage with custom logger
 * import { createErrHandlerMiddleware } from './middleware/errorHandler.js';
 * import { ConsoleLogger } from './logging/ConsoleLogger.js';
 *
 * const logger = new ConsoleLogger();
 * app.use(createErrHandlerMiddleware(logger));
 *
 * // Usage in Express application
 * import express from 'express';
 * import { createErrHandlerMiddleware } from './middleware/errorHandler.js';
 *
 * const app = express();
 *
 * // Add your routes and other middleware first
 * app.use(express.json());
 * app.use('/api', apiRoutes);
 *
 * // Then add the error handler middleware (must be last)
 * app.use(createErrHandlerMiddleware());
 * ```
 *
 * @example
 * ```typescript
 * // Complete Express.js setup example
 * import express from 'express';
 * import { createErrHandlerMiddleware } from './middleware/errorHandler.js';
 * import { ILogger } from './errors/types.js';
 *
 * class MyLogger implements ILogger {
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
 * const app = express();
 * const logger = new MyLogger();
 *
 * // Application routes
 * app.get('/users/:id', (req, res) => {
 *   // Your route logic here
 *   // If any middleware or route throws an error, it will be caught by our error handler
 * });
 *
 * // Error handling middleware (must be the last middleware)
 * app.use(createErrHandlerMiddleware(logger));
 *
 * app.listen(3000, () => {
 *   console.log('Server running on port 3000');
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
 * @see {@link HttpErrorHandlerStrategy} for HTTP error handling
 * @see {@link InputValidationErrorHandlerStrategy} for validation error handling
 * @see {@link FallbackErrorStrategy} for unhandled error fallback
 * @see {@link HttpErrorSerializer} for HTTP error response serialization
 */
export const createErrHandlerMiddleware = (logger?: ILogger) =>
  new ErrorHandler([
    new HttpErrorHandlerStrategy(new HttpErrorSerializer(), logger),
    new InputValidationErrorHandlerStrategy(logger),
    new FallbackErrorStrategy(logger),
  ]).handle;
