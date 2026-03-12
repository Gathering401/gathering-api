import { Router } from 'express';
import { getUser, getAllUsers } from './controller';
import { check } from '../common/middleware/IsAuthenticated';

const router = Router();

router.get('/', check, getUser);
router.get('/all', check, getAllUsers);

export default router;
