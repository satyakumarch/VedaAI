import { Router } from 'express';
import {
  createAssignment,
  getAssignments,
  getAssignment,
  deleteAssignment,
  regenerateAssignment,
} from '../controllers/assignmentController';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getAssignments);
router.post('/', upload.single('file'), createAssignment);
router.get('/:id', getAssignment);
router.delete('/:id', deleteAssignment);
router.post('/:id/regenerate', regenerateAssignment);

export default router;
