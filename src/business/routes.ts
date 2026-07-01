import {Router} from 'express';
import {loginBusiness, signupBusiness} from './controller';
import {isBusinessAuthenticated} from '../common/middleware/isBusinessAuthenticated';

const router = Router();

router.post('/signup', signupBusiness);
router.post('/login', loginBusiness);
router.use(isBusinessAuthenticated);

export default router;