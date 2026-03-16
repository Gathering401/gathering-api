import { Router } from 'express';
import {changeOwner, createGroup, inviteUser, removeGroup, respondToInvite, updateGroup} from './controller';
import {isAdmin, isAuthenticated, isInGroup, isOwner, isPendingInvite} from "../common/middleware";

const router = Router();

router.use(isAuthenticated);

router.post('/', createGroup);
router.put('/', isInGroup, isAdmin, updateGroup);
router.delete('/', isInGroup, isOwner, removeGroup);
router.post('/change-owner', isInGroup, isOwner, changeOwner);
router.post('/invite-user', isInGroup, isAdmin, inviteUser);
router.put('/invite-response', isPendingInvite, respondToInvite);

export default router;
