import {Router} from 'express';
import {createEvent} from './controller';
import {isAuthenticated, isInGroup} from "../common/middleware";

const router = Router();

router.use(isAuthenticated, isInGroup);

router.post('/', createEvent);

export default router;
