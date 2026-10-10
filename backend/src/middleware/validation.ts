import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

interface ValidatedRequest extends Request {
  validatedBody?: unknown;
}

export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const messages = result.error.errors.map((e) => ({
        field: e.path.join(".") || "body",
        message: e.message,
      }));
      res.status(400).json({
        error: "Validation failed",
        details: messages,
      });
      return;
    }
    const validated = req as ValidatedRequest;
    validated.validatedBody = result.data;
    next();
  };
}

export function getValidatedBody<T>(req: Request): T {
  const validated = req as ValidatedRequest;
  return validated.validatedBody as T;
}
