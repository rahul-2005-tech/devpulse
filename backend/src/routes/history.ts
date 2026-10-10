import { Router, Request, Response } from "express";
import { AppError, asyncHandler } from "../middleware/errorHandler";
import { getHistory, deleteHistoryEntry } from "../services/database";
import type { HistoryEntry } from "../types";

const router = Router();

router.get("/", asyncHandler(async (_req: Request, res: Response) => {
  const entries = await getHistory();
  res.json(entries as HistoryEntry[]);
}));

router.delete("/:id", asyncHandler(async (req: Request, res: Response) => {
  const rawId = req.params.id;
  const id = parseInt(rawId as string, 10);
  if (isNaN(id) || id <= 0) {
    throw new AppError(400, "Invalid history entry ID");
  }
  const deleted = await deleteHistoryEntry(id);
  if (!deleted) {
    throw new AppError(404, `History entry not found: ${id}`);
  }
  res.status(200).json({ deleted: true, id });
}));

export default router;
