import { beforeEach, describe, expect, it, vi } from "vitest";
import { IErrorHandlingStrategy } from "../strategies/interfaces/IErrorHandlingStrategy.js";
import { HttpErrorHandlerStrategy } from "../strategies/HttpErrorHandlerStrategy.js";
import { mockHttpErrorSerializer } from "../../serializers/interfaces/mocks.js";
import { HttpError } from "../../errors/HttpError.js";
import {
  errorResponse,
  httpErrorConstructor,
  serializeErrorReturnValue,
} from "./data.js";
import { mockLogger, mockResponse } from "./mocks.js";

import { ErrorResponse } from "../../errors/types.js";
describe("HttpErrorHandlerStrategy", () => {
  let httpErrorHandlerStrategy: IErrorHandlingStrategy;
  let res: Response;

  beforeEach(() => {
    vi.clearAllMocks();
    httpErrorHandlerStrategy = new HttpErrorHandlerStrategy(
      mockHttpErrorSerializer
    );
  });
  class HttpErrorInstance extends HttpError {
    statusCode = 500;
  }
  it("return true from canHandle if HttpError instance is passed", () => {
    expect(
      httpErrorHandlerStrategy.canHandle(
        new HttpErrorInstance(httpErrorConstructor)
      )
    ).toBe(true);
  });
  it("return false from canHandle if HttpError instance is passed", () => {
    expect(httpErrorHandlerStrategy.canHandle(new Error())).toBe(false);
  });

  it("call res.status and res.json and not call httpErrorSerializer.serializerError and log[logLevel] when logger is not passed when creating HttpErrorStrategyHandler instance ", () => {
    mockHttpErrorSerializer.serializeResponse.mockReturnValue(errorResponse);
    const { status, response } = httpErrorHandlerStrategy.handle(
      new HttpErrorInstance(httpErrorConstructor)
    );

    expect(status).toBe(500);
    expect(response).toEqual(errorResponse);
    expect(mockHttpErrorSerializer.serializerError).not.toHaveBeenCalled();
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });
  it("call httpErrorSerializer.serializerError and log[logLevel] when logger is passed when creating HttpErrorStrategyHandler instance", () => {
    const httpErrorHandlerStrategyWithLogger = new HttpErrorHandlerStrategy(
      mockHttpErrorSerializer,
      mockLogger
    );
    mockHttpErrorSerializer.serializeResponse.mockReturnValue(errorResponse);
    mockHttpErrorSerializer.serializerError.mockReturnValue(
      serializeErrorReturnValue
    );
    httpErrorHandlerStrategyWithLogger.handle(
      new HttpErrorInstance(httpErrorConstructor)
    );

    expect(mockHttpErrorSerializer.serializerError).toHaveBeenCalled();
    expect(mockLogger.warn).toHaveBeenCalled();
  });
});
