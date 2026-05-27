// ============================================================
// VedaAI Backend - Group Controller
// ============================================================
import { Request, Response } from 'express';
import { Group } from '../models/Group';
import { sendSuccess, sendCreated, sendError } from '../utils/apiResponse';
import { z } from 'zod';

const createGroupSchema = z.object({
  name:         z.string().min(2).max(100),
  subject:      z.string().min(2).max(100),
  grade:        z.string().min(1).max(50),
  studentCount: z.coerce.number().int().min(0).max(1000).default(0),
  description:  z.string().max(500).optional(),
  color:        z.string().optional().default('blue'),
});

export const getGroups = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const groups = await Group.find({ userId }).sort({ createdAt: -1 }).lean();
  sendSuccess(res, groups);
};

export const createGroup = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const parsed = createGroupSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors = parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }));
    res.status(400).json({ success: false, message: 'Validation failed', errors });
    return;
  }
  const group = await Group.create({ userId, ...parsed.data });
  sendCreated(res, group, 'Group created successfully');
};

export const deleteGroup = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId  = req.user!.userId;
  const group   = await Group.findOneAndDelete({ _id: id, userId });
  if (!group) { sendError(res, 'Group not found', 404); return; }
  sendSuccess(res, null, 'Group deleted');
};

export const updateGroup = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId  = req.user!.userId;
  const parsed  = createGroupSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: 'Validation failed' });
    return;
  }
  const group = await Group.findOneAndUpdate({ _id: id, userId }, parsed.data, { new: true });
  if (!group) { sendError(res, 'Group not found', 404); return; }
  sendSuccess(res, group, 'Group updated');
};
