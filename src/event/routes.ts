import {Router} from 'express';
import {createEvent, getEvent} from './controller';
import {isAuthenticated, isInGroup} from "../common/middleware";

const router = Router();

router.use(isAuthenticated);

router.post('/', isInGroup, createEvent);
router.get('/', isInGroup, getEvent);

export default router;
