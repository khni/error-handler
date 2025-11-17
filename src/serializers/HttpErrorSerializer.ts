import { HttpError } from "../errors/HttpError.js";
import { ErrorResponse } from "../errors/types.js";
import { IHttpErrorSerializer } from "./interfaces/IHttpErrorSerializer.js";

/**
 * Default implementation of IHttpErrorSerializer that provides
 * comprehensive error serialization for HTTP errors.
 *
 * Features:
 * - Error chain flattening for complete root cause analysis
 * - Client-safe response generation
 * - Detailed error information for logging
 * - Protection against circular reference infinite loops
 *
 * @public
 *
 * @example
 * ```typescript
 * const serializer = new HttpErrorSerializer();
 *
 * // For logging purposes
 * const detailedError = serializer.serializerError(httpError);
 * logger.error('Request failed', detailedError);
 *
 * // For client responses
 * const clientError = serializer.serializeResponse(httpError);
 * res.status(500).json(clientError);
 * ```
 */
export class HttpErrorSerializer implements IHttpErrorSerializer {
  /**
   * Creates a new instance of HttpErrorSerializer
   */
  constructor() {}

  /**
   * Flattens the error cause chain into an array for easier analysis.
   * Traverses the error cause chain up to 100 levels deep to prevent infinite loops.
   *
   * @param error - The HttpError instance to analyze
   * @returns Array of error causes in order from immediate cause to root cause
   *
   * @private
   *
   * @example
   * ```typescript
   * const causes = serializer.flattenErrorCauses(error);
   * causes.forEach((cause, index) => {
   *   console.log(`Cause ${index}:`, cause.name, cause.message);
   * });
   * ```
   */
  private flattenErrorCauses(error: HttpError): Array<Record<string, any>> {
    const result: Array<Record<string, any>> = [];
    let current: unknown = error;
    let count = 0;

    // Safety limit to prevent infinite loops with circular references
    const MAX_CAUSE_DEPTH = 100;

    while (
      current instanceof Error &&
      current.cause &&
      count < MAX_CAUSE_DEPTH
    ) {
      current = current.cause;

      if (current instanceof Error) {
        const causeInfo: Record<string, any> = {
          name: current.name,
          message: current.message,
          stack: current.stack,
        };

        // Copy other useful fields if present
        if ("code" in current) causeInfo.code = (current as any).code;
        if ("responseMessage" in current)
          causeInfo.responseMessage = (current as any).responseMessage;
        if ("meta" in current) causeInfo.meta = (current as any).meta;

        result.push(causeInfo);
      }
      count++;
    }

    return result;
  }

  /**
   * Serializes an HttpError into a detailed object containing both top-level
   * error information and the complete cause chain. This method is designed
   * for logging and debugging purposes.
   *
   * @param error - The HttpError instance to serialize
   * @returns Object containing top-level error details and cause chain
   *
   * @example
   * ```typescript
   * try {
   *   // Some operation that throws HttpError
   * } catch (error) {
   *   if (error instanceof HttpError) {
   *     const serialized = serializer.serializerError(error);
   *     logger.error('Operation failed', {
   *       topLevelError: serialized.topLevel,
   *       rootCause: serialized.causeChain[serialized.causeChain.length - 1]
   *     });
   *   }
   * }
   * ```
   */
  serializerError = (error: HttpError) => {
    const fullErrorChain = this.flattenErrorCauses(error);

    return {
      topLevel: {
        name: error.name,
        message: error.message,
        code: error.code,
        logLevel: error.logLevel,
        responseMessage: error.responseMessage,
        meta: error.meta,
        stack: error.stack,
      },
      causeChain: fullErrorChain,
    };
  };

  /**
   * Serializes an HttpError into a client-safe error response.
   * This method ensures no sensitive information (like stack traces or
   * internal messages) is exposed to clients.
   *
   * @param error - The HttpError instance to serialize
   * @returns Standardized ErrorResponse object safe for client consumption
   *
   * @example
   * ```typescript
   * app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
   *   if (error instanceof HttpError) {
   *     const clientResponse = serializer.serializeResponse(error);
   *     return res.status(error.statusCode).json(clientResponse);
   *   }
   *   // Handle other error types...
   * });
   * ```
   */
  serializeResponse = (error: HttpError) => {
    const err: ErrorResponse<unknown> = {
      errorType: "Server",
      error: {
        message: error.responseMessage, // Use client-safe message
        code: error.code,
        name: error.name,
      },
    };
    return err;
  };
}
