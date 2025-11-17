import { Mocked, vi } from "vitest";

import { IHttpErrorSerializer } from "./IHttpErrorSerializer.js";

export const mockHttpErrorSerializer: Mocked<IHttpErrorSerializer> = {
  serializerError: vi.fn(),
  serializeResponse: vi.fn(),
};
