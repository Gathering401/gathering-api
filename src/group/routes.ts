import { Router } from 'express';
import {changeOwner, createGroup, removeGroup, updateGroup} from './controller';
import {isAdmin, isAuthenticated, isInGroup, isOwner} from "../common/middleware";

const router = Router();

router.use(isAuthenticated);

router.post('/', createGroup);
router.put('/', isInGroup, isAdmin, updateGroup);
router.delete('/', isInGroup, isOwner, removeGroup);
router.post('/change-owner', isInGroup, isOwner, changeOwner);

export default router;
