import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

// Express 4 does not forward rejected promises from async handlers to the error
// middleware; without this wrapper an async throw becomes an unhandled rejection
// and crashes the process on Node 15+.
export function asyncHandler<T extends (req: Request, res: Response, next: NextFunction) => Promise<unknown>>(handler: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error("[backend error]", err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
    });
    return;
  }

  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({
      error: "Invalid request body",
    });
    return;
  }

  // Unexpected error — never leak internals to the client.
  res.status(500).json({
    error: NODE_ENV !== "production" ? err.message : "Internal server error",
  });
}

let NODE_ENV = process.env.NODE_ENV || "development";
