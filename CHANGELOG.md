# @khni/error-handler

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
