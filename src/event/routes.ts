import {Router} from 'express';
import {
    cancelEvent,
    changeRsvp,
    createEvent,
    declineInvitation,
    getActiveInvitations,
    getEvent,
    getEvents,
    getGroupAvailability,
    getInvitationDetails,
    getPendingInvitations,
    updateEvent,
    updateNotifications
} from './controller';
import {isAdminOrHost, isAuthenticated, isInGroup} from "../common/middleware";
import {canCreate} from "../common/middleware/canCreate";

const router = Router();

router.use(isAuthenticated);

router.post('/', isInGroup, canCreate, createEvent);
router.get('/', isInGroup, getEvent);
router.get('/all', getEvents);
router.get('/pending-invitations', getPendingInvitations);
router.put('/', isInGroup, isAdminOrHost, updateEvent);
router.delete('/', isInGroup, isAdminOrHost, cancelEvent);
router.put('/rsvp', isInGroup, changeRsvp);
router.put('/notifications', isInGroup, updateNotifications);
router.get('/invitations', getActiveInvitations);
router.put('/invitations/decline', declineInvitation);
router.get('/invitations/:id', getInvitationDetails);
router.get('/availability', isInGroup, canCreate, getGroupAvailability);

export default router;
