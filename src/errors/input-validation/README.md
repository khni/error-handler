# Integration Guide

## Basic Integration with Zod and InputValidationError

### Overview

The `zodErrorSerializer` seamlessly integrates with the `InputValidationError` class to provide a robust validation error handling system for Zod schemas.

### Basic Setup

```typescript
// src/validation/userValidation.ts
import { z } from "zod";
import { InputValidationError } from "../errors/InputValidationError.js";
import { zodErrorSerializer } from "../serializers/zodErrorSerializer.js";

// Define Zod schema
const userRegistrationSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  profile: z.object({
    firstName: z.string().min(1, "First name is required"),
    age: z.number().min(18, "Must be at least 18 years old"),
  }),
});

// Validation function using InputValidationError
export const validateUserRegistration = async (data: unknown) => {
  try {
    return await userRegistrationSchema.parseAsync(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new InputValidationError(error, zodErrorSerializer);
    }
    throw error;
  }
};
```

### Express.js Controller Usage

```typescript
// In your Express controller
app.post("/register", async (req, res, next) => {
  try {
    const validatedData = await validateUserRegistration(req.body);
    const user = await userService.create(validatedData);
    res.status(201).json(user);
  } catch (error) {
    next(error); // Pass to error handling middleware
  }
});
```

### Error Handling Middleware

```typescript
// src/middleware/errorHandler.ts
import { InputValidationError } from "../errors/InputValidationError.js";
import { HttpError } from "../errors/HttpError.js";

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Handle InputValidationError (Zod validation errors)
  if (error instanceof InputValidationError) {
    return res.status(400).json({
      errorType: "InputValidation",
      error: error.toJSON(),
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }

  // Handle HttpError
  if (error instanceof HttpError) {
    return res.status(error.statusCode).json({
      errorType: "Server",
      error: {
        name: error.name,
        message: error.responseMessage,
        code: error.code,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Handle unexpected errors
  console.error("Unexpected error:", error);
  res.status(500).json({
    errorType: "Server",
    error: {
      name: "InternalServerError",
      message: "An unexpected error occurred",
      code: "INTERNAL_ERROR",
    },
    timestamp: new Date().toISOString(),
  });
};

// Register middleware
app.use(errorHandler);
```

### Expected API Response

When validation fails, the API returns:

```json
{
  "errorType": "InputValidation",
  "error": {
    "name": "ValidationError",
    "errors": [
      {
        "field": "email",
        "messages": ["Invalid email format"]
      },
      {
        "field": "password",
        "messages": [
          "Password must be at least 8 characters",
          "Password must contain at least one uppercase letter"
        ]
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/register"
}
```

## Advanced Integration and Custom Validation Service

### Advanced Validation Service

For more complex applications, create a dedicated validation service:

```typescript
// src/services/ValidationService.ts
import { ZodError, ZodSchema } from "zod";
import { InputValidationError } from "../errors/InputValidationError.js";
import { zodErrorSerializer } from "../serializers/zodErrorSerializer.js";

export interface ValidationContext {
  entity: string;
  action: string;
  userId?: string;
  requestId?: string;
}

export class ValidationService {
  /**
   * Validates data against a Zod schema and throws InputValidationError on failure
   */
  static async validate<T>(
    schema: ZodSchema<T>,
    data: unknown,
    context: ValidationContext = { entity: "Data", action: "validate" }
  ): Promise<T> {
    try {
      return await schema.parseAsync(data);
    } catch (error) {
      if (error instanceof ZodError) {
        // Enhance error messages with context
        const enhancedError = new ZodError([
          ...error.issues.map((issue) => ({
            ...issue,
            message: this.enhanceErrorMessage(issue.message, context),
          })),
        ]);

        throw new InputValidationError(enhancedError, zodErrorSerializer);
      }
      throw error;
    }
  }

  /**
   * Batch validate multiple schemas
   */
  static async validateAll(
    validations: Array<{
      schema: ZodSchema<unknown>;
      data: unknown;
      context: ValidationContext;
    }>
  ): Promise<
    Array<{ success: boolean; data?: unknown; error?: InputValidationError }>
  > {
    const results = await Promise.allSettled(
      validations.map(async ({ schema, data, context }) => {
        try {
          const validated = await this.validate(schema, data, context);
          return { success: true, data: validated };
        } catch (error) {
          if (error instanceof InputValidationError) {
            return { success: false, error };
          }
          throw error;
        }
      })
    );

    return results.map((result) =>
      result.status === "fulfilled" ? result.value : { success: false }
    );
  }

  private static enhanceErrorMessage(
    message: string,
    context: ValidationContext
  ): string {
    return `${context.entity} ${message.toLowerCase()}`;
  }
}
```

### Usage in Complex Scenarios

```typescript
// src/controllers/UserController.ts
import { ValidationService } from "../services/ValidationService.js";
import {
  userSchema,
  profileSchema,
  preferencesSchema,
} from "../validation/schemas.js";

export class UserController {
  static async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const validationContext = {
        entity: "User",
        action: "creation",
        userId: req.user?.id,
        requestId: req.id,
      };

      // Validate multiple related schemas
      const [userData, profileData, preferencesData] = await Promise.all([
        ValidationService.validate(
          userSchema,
          req.body.user,
          validationContext
        ),
        ValidationService.validate(profileSchema, req.body.profile, {
          ...validationContext,
          entity: "User Profile",
        }),
        ValidationService.validate(preferencesSchema, req.body.preferences, {
          ...validationContext,
          entity: "User Preferences",
        }),
      ]);

      const user = await userService.createCompleteUser({
        user: userData,
        profile: profileData,
        preferences: preferencesData,
      });

      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }

  static async batchCreateUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { users } = req.body;

      const validations = users.map((user: unknown, index: number) => ({
        schema: userSchema,
        data: user,
        context: {
          entity: `User[${index}]`,
          action: "batch creation",
          requestId: req.id,
        },
      }));

      const results = await ValidationService.validateAll(validations);

      const successfulUsers = results
        .filter(
          (result): result is { success: true; data: any } => result.success
        )
        .map((result) => result.data);

      const failedValidations = results.filter(
        (result): result is { success: false; error: InputValidationError } =>
          !result.success && result.error
      );

      if (failedValidations.length > 0) {
        // Create a comprehensive error report
        const batchError = new InputValidationError(
          { failures: failedValidations },
          (failures: any) => ({
            name: "BatchValidationError",
            errors: failures.failures.flatMap((failure: any) =>
              failure.error.errors.map((err: any) => ({
                field: `batch.${err.field}`,
                messages: err.messages,
              }))
            ),
          })
        );
        throw batchError;
      }

      const createdUsers = await userService.batchCreate(successfulUsers);
      res.status(207).json({
        // 207 Multi-Status
        created: createdUsers.length,
        users: createdUsers,
      });
    } catch (error) {
      next(error);
    }
  }
}
```

### Custom Serializer for Complex Errors

```typescript
// src/serializers/advancedErrorSerializer.ts
import { ZodError } from "zod";
import { ErrorSerializer } from "../errors/InputValidationError.js";

export const advancedZodErrorSerializer: ErrorSerializer<ZodError> = (
  error
) => {
  const grouped: Record<string, { messages: string[]; codes: string[] }> = {};

  for (const issue of error.issues) {
    const field = issue.path.join(".") || "general";

    if (!grouped[field]) {
      grouped[field] = { messages: [], codes: [] };
    }

    grouped[field].messages.push(issue.message);

    // Include error codes for more detailed client handling
    if (issue.code && !grouped[field].codes.includes(issue.code)) {
      grouped[field].codes.push(issue.code);
    }
  }

  return {
    name: "DetailedValidationError",
    errors: Object.entries(grouped).map(([field, { messages, codes }]) => ({
      field,
      messages,
      metadata: {
        errorCodes: codes,
        fieldType: this.inferFieldType(field),
        severity: this.determineSeverity(codes),
      },
    })),
  };
};

// Helper functions for enhanced error information
function inferFieldType(field: string): string {
  if (field.includes("email")) return "email";
  if (field.includes("password")) return "password";
  if (field.includes("url")) return "url";
  return "text";
}

function determineSeverity(codes: string[]): "low" | "medium" | "high" {
  if (codes.includes("too_small") || codes.includes("too_big")) return "medium";
  if (codes.includes("invalid_type")) return "high";
  return "low";
}
```

### Testing the Advanced Integration

```typescript
// tests/ValidationService.test.ts
import { describe, it, expect } from "vitest";
import { z } from "zod";
import { ValidationService } from "../src/services/ValidationService.js";
import { InputValidationError } from "../src/errors/InputValidationError.js";

const complexSchema = z.object({
  user: z.object({
    email: z.string().email(),
    preferences: z.object({
      newsletter: z.boolean(),
      notifications: z.object({
        email: z.boolean(),
        sms: z.boolean(),
      }),
    }),
  }),
});

describe("ValidationService Advanced Usage", () => {
  it("should enhance error messages with context", async () => {
    const invalidData = {
      user: {
        email: "invalid-email",
        preferences: {
          newsletter: "not-a-boolean",
          notifications: {
            email: true,
            sms: "invalid",
          },
        },
      },
    };

    try {
      await ValidationService.validate(complexSchema, invalidData, {
        entity: "ComplexUser",
        action: "validation",
      });
      expect.fail("Should have thrown validation error");
    } catch (error) {
      expect(error).toBeInstanceOf(InputValidationError);
      const inputError = error as InputValidationError;

      // Enhanced messages should include entity context
      expect(inputError.getFieldErrors("user.email")[0]).toContain(
        "ComplexUser"
      );
      expect(
        inputError.getFieldErrors("user.preferences.newsletter")[0]
      ).toContain("ComplexUser");
    }
  });

  it("should handle batch validation with mixed results", async () => {
    const validations = [
      {
        schema: z.object({ email: z.string().email() }),
        data: { email: "valid@email.com" },
        context: { entity: "User1", action: "test" },
      },
      {
        schema: z.object({ email: z.string().email() }),
        data: { email: "invalid" },
        context: { entity: "User2", action: "test" },
      },
    ];

    const results = await ValidationService.validateAll(validations);

    expect(results).toHaveLength(2);
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(false);
    expect(results[1].error).toBeInstanceOf(InputValidationError);
  });
});
```

### Configuration and Best Practices

```typescript
// src/config/validationConfig.ts
export const validationConfig = {
  // Maximum depth for nested object validation
  maxValidationDepth: 10,

  // Custom error message templates
  errorTemplates: {
    required: (field: string) => `${field} is required`,
    invalid: (field: string) => `${field} is invalid`,
    tooShort: (field: string, min: number) =>
      `${field} must be at least ${min} characters`,
  },

  // Field name transformations for better error messages
  fieldNameTransform: (path: string[]) => {
    const lastSegment = path[path.length - 1];
    // Convert camelCase to human readable
    return lastSegment.replace(/([A-Z])/g, " $1").toLowerCase();
  },
};

// Custom validation middleware factory
export const createValidationMiddleware = (
  schema: ZodSchema,
  context?: Partial<ValidationContext>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = await ValidationService.validate(schema, req.body, {
        entity: "Request",
        action: "validation",
        ...context,
      });

      // Attach validated data to request for downstream middleware
      req.validatedData = validatedData;
      next();
    } catch (error) {
      next(error);
    }
  };
};
```

This advanced integration provides:

- **Context-aware validation** with enhanced error messages
- **Batch validation** for multiple data objects
- **Custom serializers** with detailed error metadata
- **Comprehensive testing** strategies
- **Configuration management** for validation behavior
- **Middleware factories** for reusable validation logic

The system is designed to scale from simple form validation to complex enterprise applications with multiple validation scenarios and detailed error reporting.
