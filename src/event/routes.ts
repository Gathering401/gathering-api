import {Router} from 'express';
import {createEvent, getEvent, getEvents, updateEvent} from './controller';
import {isAdminOrHost, isAuthenticated, isInGroup} from "../common/middleware";

const router = Router();

router.use(isAuthenticated);

router.post('/', isInGroup, createEvent);
router.get('/', isInGroup, getEvent);
router.get('/all', getEvents);
router.put('/', isInGroup, isAdminOrHost, updateEvent);

export default router;
