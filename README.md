# @khni/error-handler

A robust, TypeScript-first error handling library providing structured error classes with built-in logging support, HTTP error handling, and standardized error responses.

## Features

- 🏗 **Type-Safe Errors** - Fully typed error classes with generic code support
- 🌐 **HTTP Error Support** - Specialized errors for HTTP APIs with status codes
- 📝 **Structured Logging** - Built-in log levels and metadata support
- 🔍 **Error Chaining** - Support for error causes with native `cause` property
- 🎯 **Validation Errors** - Standardized input validation error format
- 🔄 **Error Mapping** - Convert business errors to HTTP errors automatically
- 📚 **API Documentation** - Comprehensive documentation generated with TypeScript
- 🛡 **Production Ready** - Express middleware and error handling strategies

## Installation

```bash
npm install @khni/error-handler
pnpm add @khni/error-handler
yarn add @khni/error-handler
```

## Quick Start

### Basic CustomError Usage

```typescript
import { CustomError } from "@khni/error-handler";

class BusinessError extends CustomError<
  "INVALID_OPERATION" | "MISSING_REQUIRED"
> {
  constructor(message: string, code: "INVALID_OPERATION" | "MISSING_REQUIRED") {
    super({
      name: "BusinessError",
      message,
      code,
      logLevel: "warn",
    });
  }
}

// Usage
throw new BusinessError("Operation not allowed", "INVALID_OPERATION");
```

### HTTP Error Usage

```typescript
import { HttpError } from "@khni/error-handler";

class NotFoundError extends HttpError {
  statusCode = 404;

  constructor(resource: string) {
    super({
      name: "NotFoundError",
      message: `Resource not found: ${resource}`,
      responseMessage: `${resource} not found`,
      code: "RESOURCE_NOT_FOUND",
      logLevel: "info",
    });
  }
}

// Usage in Express.js
app.get("/users/:id", (req, res) => {
  const user = findUser(req.params.id);
  if (!user) {
    throw new NotFoundError("User");
  }
  res.json(user);
});
```

## Complete Express.js Integration

### 1. Setup Error Handling Middleware

```typescript
import express from "express";
import { createErrHandlerMiddleware } from "@khni/error-handler";

const app = express();

// Your routes and other middleware
app.use(express.json());
app.use("/api", apiRoutes);

// Error handling middleware (must be last)
app.use(createErrHandlerMiddleware());

app.listen(3000);
```

### 2. With Custom Logger

```typescript
import { createErrHandlerMiddleware, ILogger } from "@khni/error-handler";

class ConsoleLogger implements ILogger {
  error(message: string, meta?: {}) {
    console.error(`[ERROR] ${message}`, meta);
  }
  warn(message: string, meta?: {}) {
    console.warn(`[WARN] ${message}`, meta);
  }
  info(message: string, meta?: {}) {
    console.info(`[INFO] ${message}`, meta);
  }
  debug(message: string, meta?: {}) {
    console.debug(`[DEBUG] ${message}`, meta);
  }
}

const logger = new ConsoleLogger();
app.use(createErrHandlerMiddleware(logger));
```

## Error Types

### CustomError

Base class for all custom errors with code type safety:

```typescript
import { CustomError } from "@khni/error-handler";

class DatabaseError extends CustomError<"CONNECTION" | "TIMEOUT" | "QUERY"> {
  constructor(code: "CONNECTION" | "TIMEOUT" | "QUERY", cause?: Error) {
    super({
      name: "DatabaseError",
      message: `Database error: ${code}`,
      code,
      logLevel: "error",
      cause,
    });
  }
}

// Usage
throw new DatabaseError("CONNECTION", connectionError);
```

### HttpError

HTTP-specific errors with status codes and client-safe messages:

```typescript
import { HttpError } from "@khni/error-handler";

class UnauthorizedError extends HttpError {
  statusCode = 401;

  constructor() {
    super({
      name: "UnauthorizedError",
      message: "Authentication required",
      responseMessage: "Please log in to access this resource",
      code: "UNAUTHORIZED",
      logLevel: "warn",
    });
  }
}

class BadRequestError extends HttpError {
  statusCode = 400;

  constructor(message: string, code: string = "BAD_REQUEST") {
    super({
      name: "BadRequestError",
      message,
      responseMessage: "Invalid request parameters",
      code,
      logLevel: "warn",
    });
  }
}
```

## Input Validation with Zod Integration

### 1. Define Validation Schema

```typescript
import { z } from "zod";
import { InputValidationError, zodErrorSerializer } from "@khni/error-handler";

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
```

### 2. Create Validation Function

```typescript
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

### 3. Use in Express Controller

```typescript
app.post("/register", async (req, res, next) => {
  try {
    const validatedData = await validateUserRegistration(req.body);
    const user = await userService.create(validatedData);
    res.status(201).json(user);
  } catch (error) {
    next(error); // Will be handled by our error middleware
  }
});
```

## Error Response Formats

### HTTP Error Response

```json
{
  "errorType": "Server",
  "error": {
    "name": "NotFoundError",
    "message": "Resource not found",
    "code": "RESOURCE_NOT_FOUND"
  }
}
```

### Input Validation Error Response

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
  }
}
```

### Fallback Error Response

```json
{
  "errorType": "Server",
  "error": {
    "name": "InternalServerError",
    "message": "An unexpected error occurred",
    "code": "INTERNAL_ERROR"
  }
}
```

## Advanced Error Mapping

### Business Logic to HTTP Error Mapping

```typescript
import { errorMapper, CustomError } from "@khni/error-handler";

// 1. Define business error codes
const ErrorCodes = {
  USER_NOT_FOUND: "USER_NOT_FOUND",
  INVALID_EMAIL: "INVALID_EMAIL",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
} as const;

type ErrorCode = keyof typeof ErrorCodes;

// 2. Create business error class
class UserError extends CustomError<ErrorCode> {
  constructor(params: Omit<CustomErrorConstructor<ErrorCode>, "name">) {
    super({ ...params, name: "UserError" });
  }
}

// 3. Define HTTP mapping
const errorMapping: Record<
  ErrorCode,
  { statusCode: number; responseMessage: string }
> = {
  USER_NOT_FOUND: {
    statusCode: 404,
    responseMessage: "User not found",
  },
  INVALID_EMAIL: {
    statusCode: 400,
    responseMessage: "Please provide a valid email address",
  },
  INSUFFICIENT_PERMISSIONS: {
    statusCode: 403,
    responseMessage: "You do not have permission to perform this action",
  },
};

// 4. Use in service layer
class UserService {
  async getUser(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new UserError({
        message: `User with ID ${userId} not found`,
        code: "USER_NOT_FOUND",
        logLevel: "warn",
        meta: { userId },
      });
    }
    return user;
  }
}

// 5. Map in controller layer
app.get("/users/:id", async (req, res, next) => {
  try {
    const user = await userService.getUser(req.params.id);
    res.json(user);
  } catch (error) {
    if (error instanceof UserError) {
      // Convert business error to HTTP error
      next(errorMapper(error, errorMapping));
    } else {
      next(error);
    }
  }
});
```

## Advanced Validation Service

For complex applications, create a dedicated validation service:

```typescript
import { ValidationService } from "@khni/error-handler";

// Advanced validation with context
const user = await ValidationService.validate(userSchema, req.body, {
  entity: "User",
  action: "creation",
});

// Batch validation
const results = await ValidationService.validateAll([
  {
    schema: userSchema,
    data: req.body.user,
    context: { entity: "User", action: "create" },
  },
  {
    schema: profileSchema,
    data: req.body.profile,
    context: { entity: "Profile", action: "create" },
  },
]);
```

## Custom Error Strategies

### Creating Custom Error Handling Strategies

```typescript
import { IErrorHandlingStrategy, Response } from "express";
import { MyCustomError } from "./MyCustomError.js";

export class CustomErrorStrategy implements IErrorHandlingStrategy {
  canHandle(err: Error): boolean {
    return err instanceof MyCustomError;
  }

  handle(err: Error, res: Response): void {
    const error = err as MyCustomError;

    // Custom handling logic
    res.status(error.customStatusCode).json({
      errorType: "Custom",
      error: error.toClientFormat(),
    });
  }
}

// Use in your error handler
const errorHandler = new ErrorHandler([
  new HttpErrorHandlerStrategy(/* ... */),
  new InputValidationErrorHandlerStrategy(/* ... */),
  new CustomErrorStrategy(), // Your custom strategy
  new FallbackErrorStrategy(/* ... */),
]);
```

## Logging Integration

### Structured Error Logging

```typescript
import { ILogger } from "@khni/error-handler";

class StructuredLogger implements ILogger {
  error(message: string, meta?: {}) {
    // Integrate with your logging system (Winston, Pino, etc.)
    console.error(
      JSON.stringify({
        level: "error",
        message,
        timestamp: new Date().toISOString(),
        ...meta,
      })
    );
  }

  warn(message: string, meta?: {}) {
    console.warn(
      JSON.stringify({
        level: "warn",
        message,
        timestamp: new Date().toISOString(),
        ...meta,
      })
    );
  }

  info(message: string, meta?: {}) {
    console.info(
      JSON.stringify({
        level: "info",
        message,
        timestamp: new Date().toISOString(),
        ...meta,
      })
    );
  }

  debug(message: string, meta?: {}) {
    console.debug(
      JSON.stringify({
        level: "debug",
        message,
        timestamp: new Date().toISOString(),
        ...meta,
      })
    );
  }
}

// Use with error handler
const logger = new StructuredLogger();
app.use(createErrHandlerMiddleware(logger));
```

## Testing

### Testing Error Scenarios

```typescript
import { describe, it, expect } from "vitest";
import { InputValidationError, zodErrorSerializer } from "@khni/error-handler";
import { ZodError } from "zod";

describe("Error Handling", () => {
  it("should create InputValidationError from ZodError", () => {
    const zodError = {
      issues: [
        { path: ["email"], message: "Invalid email", code: "invalid_string" },
      ],
    } as ZodError;

    const error = new InputValidationError(zodError, zodErrorSerializer);

    expect(error).toBeInstanceOf(InputValidationError);
    expect(error.name).toBe("ValidationError");
    expect(error.getFieldErrors("email")).toEqual(["Invalid email"]);
  });

  it("should handle error mapping", () => {
    const businessError = new UserError({
      message: "User not found",
      code: "USER_NOT_FOUND",
      logLevel: "warn",
    });

    const httpError = errorMapper(businessError, errorMapping);

    expect(httpError.statusCode).toBe(404);
    expect(httpError.responseMessage).toBe("User not found");
  });
});
```

## API Documentation

For complete API documentation, generate and view the docs:

```bash
# Generate documentation
npm run build
npm run api:extract
npm run api:docs

# View generated documentation
open docs/README.md
```

Key exports:

- [`CustomError`](./docs/CustomError.md) - Base error class with type-safe codes
- [`HttpError`](./docs/HttpError.md) - HTTP-specific error class
- [`InputValidationError`](./docs/InputValidationError.md) - Validation error class
- [`errorMapper`](./docs/errorMapper.md) - Business to HTTP error mapping
- [`createErrHandlerMiddleware`](./docs/createErrHandlerMiddleware.md) - Express middleware
- [`ILogger`](./docs/types-ILogger.md) - Logger interface
- [`ErrorResponse`](./docs/types-ErrorResponse.md) - Standardized error response types

## Best Practices

### 1. Error Hierarchy

```typescript
// Domain-specific errors extend CustomError
class DomainError extends CustomError<DomainErrorCode> {
  // Domain-specific logic
}

// HTTP errors extend HttpError
class ApiError extends HttpError {
  // API-specific logic
}
```

### 2. Consistent Error Codes

```typescript
// Use const assertions for type safety
const ErrorCodes = {
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  UNAUTHORIZED: "UNAUTHORIZED",
} as const;

type ErrorCode = keyof typeof ErrorCodes;
```

### 3. Proper Middleware Order

```typescript
// ✅ Correct order
app.use(express.json());
app.use(routes);
app.use(createErrHandlerMiddleware()); // Always last

// ❌ Incorrect order
app.use(createErrHandlerMiddleware());
app.use(routes); // Errors in routes won't be caught
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Update documentation
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

---

This library provides a complete, production-ready error handling solution for TypeScript applications with Express.js integration, type safety, and comprehensive error management capabilities.
