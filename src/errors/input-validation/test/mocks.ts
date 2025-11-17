import { ErrorSerializer } from "../InputValidationError.js";

// Mock raw error types for testing
export interface MockRawError {
  issues: Array<{
    path: string[];
    message: string;
  }>;
}

export interface MockClassValidatorError {
  property: string;
  constraints: Record<string, string>;
}

// Create test serializers
export const mockZodSerializer: ErrorSerializer<MockRawError> = (error) => ({
  name: "ZodValidationError",
  errors: error.issues.map((issue) => ({
    field: issue.path.join("."),
    messages: [issue.message],
  })),
});

export const mockClassValidatorSerializer: ErrorSerializer<
  MockClassValidatorError[]
> = (errors) => ({
  name: "ClassValidationError",
  errors: errors.map((error) => ({
    field: error.property,
    messages: Object.values(error.constraints),
  })),
});

export const mockGeneralSerializer: ErrorSerializer<unknown> = (error) => ({
  name: "GeneralValidationError",
  errors: [
    {
      field: "general",
      messages: [String(error)],
    },
  ],
});
