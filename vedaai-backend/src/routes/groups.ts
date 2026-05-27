import { Router } from 'express';
import { getGroups, createGroup, deleteGroup, updateGroup } from '../controllers/groupController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/',      getGroups);
router.post('/',     createGroup);
router.patch('/:id', updateGroup);
router.delete('/:id', deleteGroup);

export default router;
