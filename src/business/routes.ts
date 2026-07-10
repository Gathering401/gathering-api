import {Router} from 'express';
import {createInvitation, getAnalytics, listInvitations, loginBusiness, signupBusiness} from './controller';
import {isBusinessAuthenticated} from '../common/middleware/isBusinessAuthenticated';

const router = Router();

router.post('/signup', signupBusiness);
router.post('/login', loginBusiness);

router.post('/invitations', isBusinessAuthenticated, createInvitation);
router.get('/invitations', isBusinessAuthenticated, listInvitations);
router.get('/analytics', isBusinessAuthenticated, getAnalytics);

export default router;
