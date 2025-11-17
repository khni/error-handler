import { Response } from "express";
export interface IErrorHandlingStrategy {
  canHandle(err: Error): boolean;
  handle(err: Error, res: Response): void;
}
