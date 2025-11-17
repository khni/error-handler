import { HttpError } from "../../errors/HttpError.js";
import { ErrorResponse, LogLevel } from "../../errors/types.js";

/**
 * Interface for serializing HttpError instances into different formats.
 * Provides methods for full error details (logging) and client-safe responses.
 *
 * @public
 */
export interface IHttpErrorSerializer {
  /**
   * Serializes an HttpError into a detailed object including the full error chain.
   * This method is intended for logging and debugging purposes, as it includes
   * sensitive information like stack traces and full error messages.
   *
   * @param error - The HttpError instance to serialize
   * @returns Detailed error information including the complete cause chain
   *
   * @example
   * ```typescript
   * const serializer = new HttpErrorSerializer();
   * const detailedError = serializer.serializerError(httpError);
   * logger.error('HTTP error occurred', detailedError);
   * ```
   */
  serializerError: (error: HttpError) => {
    /**
     * Top-level error information
     */
    topLevel: {
      /**
       * The name of the error class
       */
      name: string;

      /**
       * The internal error message (may contain sensitive information)
       */
      message: string;

      /**
       * Unique error code identifier
       */
      code: unknown;

      /**
       * Recommended log level for this error
       */
      logLevel: LogLevel;

      /**
       * Client-safe error message (sanitized for external consumption)
       */
      responseMessage: string;

      /**
       * Additional metadata associated with the error
       */
      meta: {} | undefined;

      /**
       * Stack trace for debugging (sensitive - avoid exposing to clients)
       */
      stack: string | undefined;
    };

    /**
     * Array of error causes in the chain, from immediate cause to root cause
     */
    causeChain: Array<Record<string, any>>;
  };

  /**
   * Serializes an HttpError into a client-safe error response.
   * This method strips sensitive information and returns a standardized format
   * suitable for API responses.
   *
   * @param error - The HttpError instance to serialize
   * @returns Standardized error response safe for client consumption
   *
   * @example
   * ```typescript
   * const serializer = new HttpErrorSerializer();
   * const clientResponse = serializer.serializeResponse(httpError);
   * res.status(500).json(clientResponse);
   * ```
   */
  serializeResponse: (error: HttpError) => ErrorResponse<unknown>;
}
