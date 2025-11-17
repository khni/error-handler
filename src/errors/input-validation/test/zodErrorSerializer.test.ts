import { describe, it, expect } from "vitest";
import { ZodError } from "zod";
import { InputValidationError } from "../InputValidationError.js";
import { zodErrorSerializer } from "../zodErrorSerializer.js";

describe("zodErrorSerializer", () => {
  describe("basic functionality", () => {
    it("should serialize a simple ZodError with single field error", () => {
      // Mock a ZodError with a single issue
      const mockZodError = {
        issues: [
          {
            path: ["email"],
            message: "Invalid email format",
            code: "invalid_string",
            validation: "email",
          },
        ],
      } as unknown as ZodError;

      const result = zodErrorSerializer(mockZodError);

      expect(result).toEqual({
        name: "ValidationError",
        errors: [
          {
            field: "email",
            messages: ["Invalid email format"],
          },
        ],
      });
    });

    it("should group multiple errors for the same field", () => {
      const mockZodError = {
        issues: [
          {
            path: ["password"],
            message: "Password too short",
            code: "too_small",
            minimum: 8,
          },
          {
            path: ["password"],
            message: "Password must contain special character",
            code: "invalid_string",
            validation: "regex",
          },
        ],
      } as ZodError;

      const result = zodErrorSerializer(mockZodError);

      expect(result).toEqual({
        name: "ValidationError",
        errors: [
          {
            field: "password",
            messages: [
              "Password too short",
              "Password must contain special character",
            ],
          },
        ],
      });
    });

    it("should handle nested object paths", () => {
      const mockZodError = {
        issues: [
          {
            path: ["user", "profile", "firstName"],
            message: "First name is required",
            code: "invalid_type",
            expected: "string",
            received: "undefined",
          },
          {
            path: ["user", "profile", "age"],
            message: "Age must be positive number",
            code: "too_small",
            minimum: 0,
          },
        ],
      } as ZodError;

      const result = zodErrorSerializer(mockZodError);

      expect(result).toEqual({
        name: "ValidationError",
        errors: [
          {
            field: "user.profile.firstName",
            messages: ["First name is required"],
          },
          {
            field: "user.profile.age",
            messages: ["Age must be positive number"],
          },
        ],
      });
    });

    it("should handle errors without path as 'general' errors", () => {
      const mockZodError = {
        issues: [
          {
            path: [],
            message: "Invalid input data",
            code: "custom",
          },
        ],
      } as unknown as ZodError;

      const result = zodErrorSerializer(mockZodError);

      expect(result).toEqual({
        name: "ValidationError",
        errors: [
          {
            field: "general",
            messages: ["Invalid input data"],
          },
        ],
      });
    });
  });

  describe("integration with InputValidationError", () => {
    it("should work seamlessly with InputValidationError class", () => {
      const mockZodError = {
        issues: [
          {
            path: ["email"],
            message: "Invalid email",
            code: "invalid_string",
          },
          {
            path: ["password"],
            message: "Password required",
            code: "invalid_type",
          },
        ],
      } as ZodError;

      const validationError = new InputValidationError(
        mockZodError,
        zodErrorSerializer
      );

      expect(validationError).toBeInstanceOf(InputValidationError);
      expect(validationError.name).toBe("ValidationError");
      expect(validationError.errors).toEqual([
        { field: "email", messages: ["Invalid email"] },
        { field: "password", messages: ["Password required"] },
      ]);
    });

    it("should preserve all error messages when used with InputValidationError", () => {
      const mockZodError = {
        issues: [
          { path: ["tags", "0"], message: "Invalid tag", code: "invalid_type" },
          { path: ["tags", "1"], message: "Tag too long", code: "too_big" },
          { path: ["tags", "2"], message: "Invalid tag", code: "invalid_type" },
        ],
      } as ZodError;

      const validationError = new InputValidationError(
        mockZodError,
        zodErrorSerializer
      );

      expect(validationError.getFieldErrors("tags.0")).toEqual(["Invalid tag"]);
      expect(validationError.getFieldErrors("tags.1")).toEqual([
        "Tag too long",
      ]);
      expect(validationError.getFieldErrors("tags.2")).toEqual(["Invalid tag"]);
    });
  });

  describe("edge cases", () => {
    it("should handle empty ZodError", () => {
      const mockZodError = {
        issues: [],
      } as unknown as ZodError;

      const result = zodErrorSerializer(mockZodError);

      expect(result).toEqual({
        name: "ValidationError",
        errors: [],
      });
    });

    it("should handle mixed path types including empty paths", () => {
      const mockZodError = {
        issues: [
          { path: ["email"], message: "Email error", code: "invalid_string" },
          { path: [], message: "General error", code: "custom" },
          {
            path: ["user", "name"],
            message: "Name error",
            code: "invalid_type",
          },
        ],
      } as ZodError;

      const result = zodErrorSerializer(mockZodError);

      expect(result).toEqual({
        name: "ValidationError",
        errors: [
          { field: "email", messages: ["Email error"] },
          { field: "general", messages: ["General error"] },
          { field: "user.name", messages: ["Name error"] },
        ],
      });
    });

    it("should maintain message order for grouped fields", () => {
      const mockZodError = {
        issues: [
          { path: ["field"], message: "First error", code: "custom" },
          { path: ["field"], message: "Second error", code: "custom" },
          { path: ["field"], message: "Third error", code: "custom" },
        ],
      } as ZodError;

      const result = zodErrorSerializer(mockZodError);

      expect(result.errors[0]?.messages).toEqual([
        "First error",
        "Second error",
        "Third error",
      ]);
    });
  });
});
