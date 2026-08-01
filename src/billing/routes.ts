import express, {Router} from 'express';
import {handleStripeWebhook} from './controller';

const router = Router();

router.post('/webhook', express.raw({type: 'application/json'}), handleStripeWebhook);

export default router;
