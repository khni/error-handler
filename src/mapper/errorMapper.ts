import { CustomError } from "../errors/CustomError.js";
import { HttpError } from "../errors/HttpError.js";
import { MappedHttpError } from "./MappedHttpError.js";

/**
 * Maps CustomError instances to appropriate HttpError instances using a provided mapping configuration.
 * This function enables seamless conversion of business logic errors to HTTP errors with proper status codes
 * and client-safe messages.
 *
 * @typeParam CodeType - The type of error codes (string, number, or symbol)
 *
 * @param error - The CustomError instance to map
 * @param codeMapping - Configuration object mapping error codes to HTTP responses
 * @returns An HttpError instance with appropriate status code and response message
 *
 * @public
 *
 * @example
 * ```typescript
 * // Define error codes as const for type safety
 * const ErrorCodes = {
 *   USER_NOT_FOUND: 'USER_NOT_FOUND',
 *   INVALID_EMAIL: 'INVALID_EMAIL',
 *   INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
 * } as const;
 *
 * type ErrorCode = keyof typeof ErrorCodes;
 *
 * // Create mapping configuration
 * const errorMapping: Record<ErrorCode, { statusCode: number; responseMessage: string }> = {
 *   USER_NOT_FOUND: {
 *     statusCode: 404,
 *     responseMessage: 'User not found'
 *   },
 *   INVALID_EMAIL: {
 *     statusCode: 400,
 *     responseMessage: 'Please provide a valid email address'
 *   },
 *   INSUFFICIENT_PERMISSIONS: {
 *     statusCode: 403,
 *     responseMessage: 'You do not have permission to perform this action'
 *   }
 * };
 *
 * // Usage in service layer
 * class UserService {
 *   async getUser(userId: string) {
 *     try {
 *       const user = await userRepository.findById(userId);
 *       if (!user) {
 *         throw new UserError({
 *           name: 'UserNotFoundError',
 *           message: `User with ID ${userId} not found`,
 *           code: 'USER_NOT_FOUND',
 *           logLevel: 'warn'
 *         });
 *       }
 *       return user;
 *     } catch (error) {
 *       if (error instanceof UserError) {
 *         // Map to HTTP error for controller layer
 *         throw errorMapper(error, errorMapping);
 *       }
 *       throw error;
 *     }
 *   }
 * }
 *
 * // Usage in Express controller
 * app.get('/users/:id', async (req, res, next) => {
 *   try {
 *     const user = await userService.getUser(req.params.id);
 *     res.json(user);
 *   } catch (error) {
 *     next(error); // Will be handled by error middleware
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Advanced usage with fallback handling
 * const businessErrorMapping = {
 *   PRODUCT_OUT_OF_STOCK: { statusCode: 409, responseMessage: 'Product is out of stock' },
 *   PAYMENT_FAILED: { statusCode: 402, responseMessage: 'Payment processing failed' },
 *   // ... other mappings
 * };
 *
 * try {
 *   await orderService.processOrder(orderData);
 * } catch (error) {
 *   if (error instanceof BusinessError) {
 *     const httpError = errorMapper(error, businessErrorMapping);
 *
 *     // Log with original error context
 *     logger[httpError.logLevel](`Order processing failed: ${error.message}`, {
 *       originalError: error,
 *       mappedError: httpError
 *     });
 *
 *     throw httpError;
 *   }
 *   throw error;
 * }
 * ```
 *
 * @remarks
 * The mapper provides a clean separation between business logic errors (CustomError)
 * and presentation layer errors (HttpError). This allows:
 * - Business logic to throw domain-specific errors without HTTP concerns
 * - Consistent HTTP status code mapping across the application
 * - Client-safe error messages that don't expose internal details
 * - Fallback handling for unmapped error codes
 */
export function errorMapper<CodeType extends string | number | symbol>(
  error: CustomError<CodeType>,
  codeMapping: Record<CodeType, { statusCode: number; responseMessage: string }>
): HttpError {
  const mapping = codeMapping[error.code];

  if (!mapping) {
    // Fallback for unmapped codes - log warning and return generic error
    console.warn(
      `No HTTP mapping found for error code: ${String(error.code)}`,
      {
        errorName: error.name,
        errorMessage: error.message,
      }
    );

    return new MappedHttpError({
      statusCode: 500,
      responseMessage: "Internal Server Error",
      name: error.name,
      message: error.message,
      code: error.code,
      logLevel: error.logLevel,
      meta: error.meta,
      cause: error.cause,
    });
  }

  return new MappedHttpError({
    statusCode: mapping.statusCode,
    responseMessage: mapping.responseMessage,
    name: error.name,
    message: error.message,
    code: error.code,
    logLevel: error.logLevel,
    meta: error.meta,
    cause: error.cause,
  });
}
