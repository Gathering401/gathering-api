import { Router } from 'express';
import {
    changeOwner,
    createGroup,
    inviteUser,
    removeGroup,
    requestToJoin,
    respondToInvite, respondToRequest,
    updateGroup
} from './controller';
import {
    isAdmin,
    isAuthenticated,
    isInGroup,
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
router.post('/change-owner', isInGroup, isOwner, changeOwner);
router.post('/invite-user', isInGroup, isAdmin, isNotPendingInvite, inviteUser);
router.put('/invite-response', isPendingInvite, respondToInvite);
router.post('/request-to-join', isNotPendingInvite, requestToJoin);
router.put('/request-response', isInGroup, isAdmin, isPendingRequest, respondToRequest);

export default router;
