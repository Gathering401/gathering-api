import { Router } from 'express';
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

router.post('/signup', register);
router.post('/login', login);
router.put('/user', isAuthenticated, isCurrentUser, update);
router.delete('/user', isAuthenticated, isCurrentUser, removeUser);
router.get('/profile', isAuthenticated, getProfile);
router.put('/profile/push-token', isAuthenticated, updatePushToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/password', isAuthenticated, changePassword);

export default router;
