import {Router} from 'express';
import {
    changeOwner,
    changeRole,
    createGroup, getAvailableGroups, getGroup, getMyGroups,
    inviteUser, leaveGroup,
    removeGroup,
    removeMember,
    requestToJoin,
    respondToInvite, respondToRequest, searchUsers,
    updateGroup, updateNotificationPreference
} from './controller';
import {
    isAdmin,
    isAuthenticated,
    isInGroup, isLowerRole,
    isNotHigherRole,
    isNotOwner,
    isNotPendingInvite,
    isOwner,
    isPendingInvite,
    isPendingRequest
} from "../common/middleware";

const router = Router();

router.use(isAuthenticated);

router.post('/', createGroup);
router.put('/', isInGroup, isAdmin, updateGroup);
router.delete('/', isInGroup, isOwner, removeGroup);
router.get('/', getGroup);
router.put('/change-owner', isInGroup, isOwner, changeOwner);
router.get('/search-users', isInGroup, searchUsers);
router.post('/invite-user', isInGroup, isAdmin, isNotPendingInvite, inviteUser);
router.put('/invite-response', isPendingInvite, respondToInvite);
router.post('/request-to-join', isNotPendingInvite, requestToJoin);
router.put('/request-response', isInGroup, isAdmin, isPendingRequest, respondToRequest);
router.delete('/remove-member', isInGroup, isAdmin, isLowerRole, removeMember);
router.delete('/leave', isInGroup, isNotOwner, leaveGroup);
router.put('/change-role', isInGroup, isAdmin, isLowerRole, isNotHigherRole, changeRole);
router.get('/my-groups', getMyGroups);
router.get('/available-groups', getAvailableGroups);
router.put('/notification-preference', isInGroup, updateNotificationPreference);

export default router;
