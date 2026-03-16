import { Router } from 'express';
import {register, login, update, removeUser} from './controller';
import {isCurrentUser, isAuthenticated} from "../common/middleware";

const router = Router();

router.post('/signup', register);
router.post('/login', login);
router.put('/user/update', isAuthenticated, isCurrentUser, update);
router.delete('/user/delete', isAuthenticated, isCurrentUser, removeUser);

export default router;
