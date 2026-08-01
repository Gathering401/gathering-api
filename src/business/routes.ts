import {Router} from 'express';
import {
    cancelInvitation,
    createInvitation,
    getAnalytics, getOpenInvoice,
    getPaymentStatus,
    listInvitations,
    loginBusiness,
    signupBusiness
} from './controller';
import {isBusinessAuthenticated} from '../common/middleware/isBusinessAuthenticated';

const router = Router();

router.post('/signup', signupBusiness);
router.post('/login', loginBusiness);

router.post('/invitations', isBusinessAuthenticated, createInvitation);
router.get('/invitations', isBusinessAuthenticated, listInvitations);
router.get('/analytics', isBusinessAuthenticated, getAnalytics);
router.patch('/invitation/cancel', isBusinessAuthenticated, cancelInvitation);
router.get('/payment-status', isBusinessAuthenticated, getPaymentStatus);
router.get('/invoice/open', isBusinessAuthenticated, getOpenInvoice);

export default router;
