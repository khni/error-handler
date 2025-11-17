import { ZodError } from "zod";
import { ErrorSerializer } from "./InputValidationError.js";

/**
 * A serializer function that converts Zod validation errors into the standardized
 * InputValidationErrorType format. This serializer groups multiple error messages
 * for the same field and handles nested object paths.
 *
 * @param error - The ZodError instance to serialize
 * @returns Standardized InputValidationErrorType with grouped field errors
 *
 * @public
 *
 * @example
 * ```typescript
 * import { zodErrorSerializer } from './serializers/zodErrorSerializer.js';
 * import { InputValidationError } from './InputValidationError.js';
 *
 * // Basic usage with InputValidationError
 * try {
 *   await schema.parseAsync(data);
 * } catch (error) {
 *   if (error instanceof ZodError) {
 *     throw new InputValidationError(error, zodErrorSerializer);
 *   }
 *   throw error;
 * }
 *
 * // Direct usage without InputValidationError
 * const standardizedError = zodErrorSerializer(zodError);
 * ```
 *
 * @example
 * ```typescript
 * // Example of how Zod errors are transformed:
 *
 * // ZodError with multiple issues:
 * // [
 * //   { path: ['email'], message: 'Invalid email' },
 * //   { path: ['email'], message: 'Already taken' },
 * //   { path: ['profile', 'name'], message: 'Required' }
 * // ]
 *
 * // Becomes:
 * // {
 * //   name: "ValidationError",
 * //   errors: [
 * //     { field: "email", messages: ["Invalid email", "Already taken"] },
 * //     { field: "profile.name", messages: ["Required"] }
 * //   ]
 * // }
 * ```
 */
export const zodErrorSerializer: ErrorSerializer<ZodError> = (error) => {
  // Group issues by field path to combine multiple messages for the same field
  const grouped: Record<string, string[]> = {};

  for (const issue of error.issues) {
    // Join path array with dots (e.g., ['user', 'email'] -> 'user.email')
    // Use 'general' for errors without a specific path
    const field = issue.path.join(".") || "general";

    if (!grouped[field]) {
      grouped[field] = [];
    }
    grouped[field].push(issue.message);
  }

  return {
    name: "ValidationError",
    errors: Object.entries(grouped).map(([field, messages]) => ({
      field,
      messages,
    })),
  };
};
