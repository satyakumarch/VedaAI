import { Router } from 'express';
import { getPaper, downloadPDF, updateQuestion } from '../controllers/paperController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/:assignmentId', getPaper);
router.get('/:assignmentId/download', downloadPDF);
router.patch('/:assignmentId/sections/:sectionIndex/questions/:questionIndex', updateQuestion);

export default router;
