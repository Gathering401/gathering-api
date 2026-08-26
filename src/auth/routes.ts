import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
    register,
    login,
    update,
    removeUser,
    getProfile,
    updatePushToken,
    forgotPassword,
    resetPassword, changePassword
} from './controller';
import {isCurrentUser, isAuthenticated} from "../common/middleware";

const router = Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Too many attempts, please try again later'
    }
});

router.post('/signup', authLimiter, register);
router.post('/login', authLimiter, login);
router.put('/user', isAuthenticated, isCurrentUser, update);
router.delete('/user', isAuthenticated, isCurrentUser, removeUser);
router.get('/profile', isAuthenticated, getProfile);
router.put('/profile/push-token', isAuthenticated, updatePushToken);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.put('/password', isAuthenticated, changePassword);

export default router;