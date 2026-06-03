import { Router } from 'express';
import {register, login, update, removeUser, getProfile} from './controller';
import {isCurrentUser, isAuthenticated} from "../common/middleware";

const router = Router();

router.post('/signup', register);
router.post('/login', login);
router.put('/user', isAuthenticated, isCurrentUser, update);
router.delete('/user', isAuthenticated, isCurrentUser, removeUser);
router.get('/profile', isAuthenticated, getProfile);

export default router;
