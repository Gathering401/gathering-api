import { Router } from 'express';
import { createGroup } from './controller';
import {isAuthenticated} from "../common/middleware/isAuthenticated";

const router = Router();

router.post('/', isAuthenticated, createGroup);

export default router;
