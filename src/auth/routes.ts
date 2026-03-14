import { Router } from 'express';
import {register, login, update, removeUser} from './controller';
import {isCurrentUser} from "../common/middleware/isCurrentUser";

const router = Router();

router.post('/signup', register);
router.post('/login', login);
router.put('/user/update', isCurrentUser, update);
router.delete('/user/delete', isCurrentUser, removeUser);

export default router;
