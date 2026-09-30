import {Router} from 'express';
import {
    cancelEvent,
    changeRsvp,
    clearNotification,
    createEvent,
    declineInvitation,
    getActiveInvitations,
    getEvent,
    getEvents,
    getGroupAvailability,
    getInvitationDetails,
    getNotifications,
    getPendingInvitations,
    putNotificationsRead,
    updateEvent,
    updateNotifications
} from './controller';
import {canCreate, isAdminOrHost, isAuthenticated, isInGroup} from "../common/middleware";

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
router.get('/notification', getNotifications);
router.put('/notification/read', putNotificationsRead);
router.delete('/notification', clearNotification)

export default router;
