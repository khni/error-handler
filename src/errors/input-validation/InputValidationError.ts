import { InputValidationErrorType } from "../types.js";

/**
 * A serializer function that converts raw errors into a standardized InputValidationErrorType.
 * This allows for flexible error transformation from various validation libraries.
 *
 * @typeParam T - The type of the raw error to be serialized
 *
 * @public
 *
 * @example
 * ```typescript
 * // Zod error serializer
 * const zodSerializer: ErrorSerializer<ZodError> = (error) => ({
 *   name: "ValidationError",
 *   errors: error.errors.map((issue) => ({
 *     field: issue.path.join('.'),
 *     messages: [issue.message]
 *   }))
 * });
 *
 * // Yup error serializer
 * const yupSerializer: ErrorSerializer<ValidationError> = (error) => ({
 *   name: "ValidationError",
 *   errors: error.inner.map((err) => ({
 *     field: err.path || 'unknown',
 *     messages: [err.message]
 *   }))
 * });
 * ```
 */
export type ErrorSerializer<T = unknown> = (
  error: T
) => InputValidationErrorType;

/**
 * A generic error class for input validation failures that uses injected serializers
 * to convert raw validation errors into a standardized format.
 *
 * @typeParam T - The type of the raw validation error
 *
 * @public
 *
 * @example
 * ```typescript
 * // Using with Zod
 * const zodError = new ZodError(/* ... *\/);
 * const validationError = new InputValidationError(
 *   zodError,
 *   (error: ZodError) => ({
 *     name: "ZodValidationError",
 *     errors: error.errors.map(issue => ({
 *       field: issue.path.join('.'),
 *       messages: [issue.message]
 *     }))
 *   })
 * );
 *
 * // Using with class-validator
 * const validationErrors = [/* ... validation errors *\/];
 * const validationError = new InputValidationError(
 *   validationErrors,
 *   (errors: ValidationError[]) => ({
 *     name: "ClassValidationError",
 *     errors: errors.map(err => ({
 *       field: err.property,
 *       messages: Object.values(err.constraints || {})
 *     }))
 *   })
 * );
 * ```
 */
export class InputValidationError<T = unknown> extends Error {
  /**
   * The name of the validation error type
   */
  public readonly name: string;

  /**
   * Array of field-specific validation errors
   */
  public readonly errors: { field: string; messages: string[] }[];

  /**
   * Creates a new instance of InputValidationError.
   *
   * @param rawError - The raw validation error from any validation library
   * @param serializer - A function that converts the raw error to InputValidationErrorType
   *
   * @example
   * ```typescript
   * try {
   *   await validate(userInput);
   * } catch (rawError) {
   *   throw new InputValidationError(rawError, myCustomSerializer);
   * }
   * ```
   */
  constructor(rawError: T, serializer: ErrorSerializer<T>) {
    const serialized = serializer(rawError);
    super(serialized.name);

    this.name = serialized.name;
    // Normalize errors so each entry has a defined string `field` (fallback to 'unknown')
    this.errors = serialized.errors.map((err) => ({
      field: err.field ?? "unknown",
      messages: err.messages,
    }));

    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Converts the error to a standardized JSON format suitable for API responses.
   *
   * @returns The error in InputValidationErrorType format
   *
   * @example
   * ```typescript
   * const validationError = new InputValidationError(rawError, serializer);
   * const response = validationError.toJSON();
   *
   * // In Express middleware:
   * res.status(400).json({
   *   errorType: "InputValidation",
   *   error: validationError.toJSON()
   * });
   * ```
   */
  toJSON(): InputValidationErrorType {
    return {
      name: this.name,
      errors: this.errors,
    };
  }

  /**
   * Gets the validation errors for a specific field.
   *
   * @param fieldName - The name of the field to get errors for
   * @returns Array of error messages for the field, or empty array if no errors
   *
   * @example
   * ```typescript
   * const emailErrors = validationError.getFieldErrors('email');
   * if (emailErrors.length > 0) {
   *   console.log('Email errors:', emailErrors);
   * }
   * ```
   */
  getFieldErrors(fieldName: string): string[] {
    const fieldError = this.errors.find((error) => error.field === fieldName);
    return fieldError ? fieldError.messages : [];
  }

  /**
   * Checks if a specific field has validation errors.
   *
   * @param fieldName - The name of the field to check
   * @returns True if the field has validation errors
   *
   * @example
   * ```typescript
   * if (validationError.hasFieldError('password')) {
   *   // Show password error in UI
   * }
   * ```
   */
  hasFieldError(fieldName: string): boolean {
    return this.getFieldErrors(fieldName).length > 0;
  }

  /**
   * Gets all field names that have validation errors.
   *
   * @returns Array of field names with validation errors
   *
   * @example
   * ```typescript
   * const invalidFields = validationError.getInvalidFields();
   * invalidFields.forEach(field => {
   *   highlightFieldError(field);
   * });
   * ```
   */
  getInvalidFields(): string[] {
    return this.errors.map((error) => error.field);
  }
}
