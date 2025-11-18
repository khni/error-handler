# @khni/error-handler

## 1.1.0

### Minor Changes

---

## '@khni/error-handler': minor

- **Automatic Conversion**: Transforms `CustomError` instances to `HttpError` with proper HTTP status codes
- **Type-Safe Mapping**: Generic type constraints ensure compile-time safety for error codes
- **Fallback Handling**: Automatic 500 Internal Server Error for unmapped codes
- **Context Preservation**: Maintains metadata, causes, and log levels during conversion

- **HTTP Integration**: Concrete `HttpError` implementation for mapped errors
- **Status Code Support**: Proper HTTP status code assignment
- **Prototype Chain**: Maintains proper inheritance for error handling

- **Clean Separation**: Business logic throws domain errors, presentation layer handles HTTP concerns
- **Consistent Responses**: Standardized error responses across the application
- **Extensible Design**: Easy to add new error code mappings
- **Production Ready**: Proper logging and client-safe error messages

```typescript
// Define mapping
const errorMapping = {
  USER_NOT_FOUND: { statusCode: 404, responseMessage: "User not found" },
  INVALID_EMAIL: { statusCode: 400, responseMessage: "Invalid email" },
};

// Map business error to HTTP error
const httpError = errorMapper(businessError, errorMapping);
```

## 1.0.0

### Major Changes

---

## '@khni/error-handler': minor

- **ErrorHandler**: Main coordinator using Chain of Responsibility pattern
- **Strategy Pattern**: Specialized handlers for different error types
- **Middleware Factory**: Easy Express.js integration

- **HttpErrorHandlerStrategy**: Handles HTTP errors with status codes and serialization
- **InputValidationErrorHandlerStrategy**: Manages validation errors with 400 responses
- **FallbackErrorStrategy**: Catch-all for unexpected errors with 500 responses

- **HttpErrorSerializer**: Consistent error response formatting
- **Standardized Error Types**: Uniform API response structure
- **Client-Safe Messages**: Separation of internal and external error messages

- **Comprehensive Logging**: Structured logging with error context
- **Type Safety**: Full TypeScript support with generics
- **Extensible Design**: Easy to add custom error strategies
- **Middleware Ready**: Express.js compatible error handling

```typescript
// Simple setup
app.use(createErrHandlerMiddleware());

// With custom logger
app.use(createErrHandlerMiddleware(myLogger));
```

## 0.3.0

### Minor Changes

- - Implement InputValidationError class with customizable serializers
  - Add zodErrorSerializer for standardized Zod error formatting
  - Include comprehensive error handling utilities and middleware
  - Add detailed documentation and test coverage

## 0.2.0

### Minor Changes

- # implementation of IHttpErrorSerializer that provides comprehensive error serialization for HTTP errors.

Features:

- Error chain flattening for complete root cause analysis
- Client-safe response generation
- Detailed error information for logging
- Protection against circular reference infinite loops

## 0.1.0

### Minor Changes

- - **CustomError**: Base abstract class for type-safe custom errors with generic code support
  - **HttpError**: Specialized abstract class for HTTP errors with status codes and client-safe messages
  - **Enhanced Error Properties**: Added `code`, `logLevel`, `meta`, and `cause` support to all errors

  - **Type-Safe Error Codes**: Generic `CodeType` parameter for compile-time error code validation
  - **Structured Error Responses**: Standardized `ErrorResponse` union type for API responses
  - **Input Validation Format**: `InputValidationErrorType` for consistent validation error reporting
  - **Logger Interface**: `ILogger` interface for seamless logging integration

  - **Comprehensive TSDoc Documentation**: Full API documentation with examples and type parameters
  - **API Extractor Integration**: Automated documentation generation pipeline
  - **Error Chaining**: Native `cause` property support for error inheritance tracking

  - **Abstract Base Classes**: Extensible design allowing custom error implementations
  - **Prototype Chain Preservation**: Proper inheritance with `Object.setPrototypeOf`
  - **TypeScript First**: Full type safety with generics and union types

  - **Dual Messaging**: Separate internal and client-facing messages for security
  - **Structured Metadata**: Flexible `meta` property for additional error context
  - **Log Level Integration**: Built-in log level assignment for automated logging

  - **Complete API Documentation**: Generated Markdown docs for all public APIs
  - **Usage Examples**: Practical code examples for common error scenarios
  - **Type Documentation**: Comprehensive type definitions with TSDoc comments

  - **API Error Handling**: HTTP status codes and client-safe error messages
  - **Business Logic Errors**: Type-safe error codes for domain-specific errors
  - **Input Validation**: Structured validation error format for form validation
  - **Logging Integration**: Built-in log levels for automated error tracking
  - **Error Recovery**: Error chaining for root cause analysis

  This release establishes a solid foundation for structured error handling in TypeScript applications, providing type safety, extensibility, and comprehensive documentation out of the box.
