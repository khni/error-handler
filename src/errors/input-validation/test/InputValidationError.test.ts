import { describe, it, expect, vi } from "vitest";
import { InputValidationErrorType } from "../../types.js";
import {
  ErrorSerializer,
  InputValidationError,
} from "../InputValidationError.js";
import {
  MockRawError,
  mockZodSerializer,
  MockClassValidatorError,
  mockClassValidatorSerializer,
  mockGeneralSerializer,
} from "./mocks.js";

describe("InputValidationError", () => {
  describe("constructor", () => {
    it("should correctly assign properties using a Zod-like serializer", () => {
      const rawError: MockRawError = {
        issues: [
          { path: ["email"], message: "Invalid email format" },
          { path: ["password"], message: "Password too short" },
        ],
      };

      const error = new InputValidationError(rawError, mockZodSerializer);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(InputValidationError);
      expect(error.name).toBe("ZodValidationError");
      expect(error.message).toBe("ZodValidationError");
      expect(error.errors).toEqual([
        { field: "email", messages: ["Invalid email format"] },
        { field: "password", messages: ["Password too short"] },
      ]);
    });

    it("should correctly assign properties using a class-validator-like serializer", () => {
      const rawErrors: MockClassValidatorError[] = [
        {
          property: "username",
          constraints: {
            isNotEmpty: "Username should not be empty",
            minLength: "Username must be at least 3 characters",
          },
        },
        {
          property: "age",
          constraints: {
            min: "Age must be at least 18",
          },
        },
      ];

      const error = new InputValidationError(
        rawErrors,
        mockClassValidatorSerializer
      );

      expect(error.name).toBe("ClassValidationError");
      expect(error.errors).toEqual([
        {
          field: "username",
          messages: [
            "Username should not be empty",
            "Username must be at least 3 characters",
          ],
        },
        {
          field: "age",
          messages: ["Age must be at least 18"],
        },
      ]);
    });

    it("should handle general unknown errors", () => {
      const rawError = "Something went wrong";
      const error = new InputValidationError(rawError, mockGeneralSerializer);

      expect(error.name).toBe("GeneralValidationError");
      expect(error.errors).toEqual([
        { field: "general", messages: ["Something went wrong"] },
      ]);
    });

    it("should preserve prototype chain for instanceof checks", () => {
      const rawError: MockRawError = {
        issues: [{ path: ["test"], message: "Test error" }],
      };

      const error = new InputValidationError(rawError, mockZodSerializer);

      expect(error instanceof InputValidationError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe("toJSON", () => {
    it("should return the error in standardized JSON format", () => {
      const rawError: MockRawError = {
        issues: [
          { path: ["email"], message: "Invalid email" },
          { path: ["password"], message: "Weak password" },
        ],
      };

      const error = new InputValidationError(rawError, mockZodSerializer);
      const json = error.toJSON();

      expect(json).toEqual({
        name: "ZodValidationError",
        errors: [
          { field: "email", messages: ["Invalid email"] },
          { field: "password", messages: ["Weak password"] },
        ],
      });
    });
  });

  describe("getFieldErrors", () => {
    it("should return error messages for a specific field", () => {
      const rawError: MockRawError = {
        issues: [
          { path: ["email"], message: "Invalid format" },
          { path: ["email"], message: "Already exists" },
          { path: ["password"], message: "Too short" },
        ],
      };

      const error = new InputValidationError(rawError, mockZodSerializer);

      expect(error.getFieldErrors("email")).toEqual(["Invalid format"]);
      expect(error.getFieldErrors("password")).toEqual(["Too short"]);
      expect(error.getFieldErrors("nonexistent")).toEqual([]);
    });
  });

  describe("hasFieldError", () => {
    it("should return true if field has errors", () => {
      const rawError: MockRawError = {
        issues: [{ path: ["email"], message: "Invalid format" }],
      };

      const error = new InputValidationError(rawError, mockZodSerializer);

      expect(error.hasFieldError("email")).toBe(true);
      expect(error.hasFieldError("password")).toBe(false);
      expect(error.hasFieldError("nonexistent")).toBe(false);
    });
  });

  describe("getInvalidFields", () => {
    it("should return all field names with errors", () => {
      const rawError: MockRawError = {
        issues: [
          { path: ["email"], message: "Invalid format" },
          { path: ["password"], message: "Too short" },
          { path: ["profile", "name"], message: "Required" },
        ],
      };

      const error = new InputValidationError(rawError, mockZodSerializer);
      const invalidFields = error.getInvalidFields();

      expect(invalidFields).toEqual(["email", "password", "profile.name"]);
      expect(invalidFields).toHaveLength(3);
    });

    it("should return empty array for no field errors", () => {
      const rawError: MockRawError = {
        issues: [],
      };

      const error = new InputValidationError(rawError, mockZodSerializer);

      expect(error.getInvalidFields()).toEqual([]);
    });
  });

  describe("serializer invocation", () => {
    it("should call the serializer with the raw error", () => {
      const mockSerializer = vi.fn().mockReturnValue({
        name: "TestError",
        errors: [],
      });

      const rawError = { test: "error" };
      new InputValidationError(rawError, mockSerializer);

      expect(mockSerializer).toHaveBeenCalledTimes(1);
      expect(mockSerializer).toHaveBeenCalledWith(rawError);
    });

    it("should use the result from the serializer", () => {
      const customResult: InputValidationErrorType = {
        name: "CustomValidationError",
        errors: [
          { field: "custom", messages: ["Custom error 1", "Custom error 2"] },
        ],
      };

      const mockSerializer = vi.fn().mockReturnValue(customResult);
      const error = new InputValidationError("any-error", mockSerializer);

      expect(error.name).toBe("CustomValidationError");
      expect(error.errors).toEqual(customResult.errors);
    });
  });

  describe("error message", () => {
    it("should use the serialized error name as the message", () => {
      const rawError: MockRawError = {
        issues: [{ path: ["test"], message: "Test" }],
      };

      const error = new InputValidationError(rawError, mockZodSerializer);

      expect(error.message).toBe("ZodValidationError");
    });
  });
});
