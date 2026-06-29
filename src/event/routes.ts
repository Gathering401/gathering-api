import {Router} from 'express';
import {
    cancelEvent,
    changeRsvp,
    createEvent,
    getEvent,
    getEvents,
    updateEvent,
    updateNotifications
} from './controller';
import {isAdminOrHost, isAuthenticated, isInGroup} from "../common/middleware";

const router = Router();

router.use(isAuthenticated);

router.post('/', isInGroup, createEvent);
router.get('/', isInGroup, getEvent);
router.get('/all', getEvents);
router.put('/', isInGroup, isAdminOrHost, updateEvent);
router.delete('/', isInGroup, isAdminOrHost, cancelEvent);
router.put('/rsvp', isInGroup, changeRsvp);
router.put('/notifications', isInGroup, updateNotifications);

export default router;
