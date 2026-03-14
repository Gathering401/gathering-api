import { Router } from 'express';
import {register, login, update} from './controller';
import {isCurrentUser} from "../common/middleware/isCurrentUser";

const router = Router();

router.post('/signup', register);
router.post('/login', login);
// @ts-ignore
router.put('/user/update', isCurrentUser, update);

export default router;
