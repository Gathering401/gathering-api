import {Router} from 'express';
import {createInvitation, listInvitations, loginBusiness, signupBusiness} from './controller';
import {isBusinessAuthenticated} from '../common/middleware/isBusinessAuthenticated';

const router = Router();

router.post('/signup', signupBusiness);
router.post('/login', loginBusiness);
router.use(isBusinessAuthenticated);
router.post('/invitations', createInvitation);
router.get('/invitations', listInvitations);

export default router;
