import express, {NextFunction, Request, Response} from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
require('dotenv').config();

import authRoutes from './auth/routes';
import groupRoutes from './group/routes';
import eventRoutes from './event/routes';
// import businessRoutes from './business/routes';
// import billingRoutes from './billing/routes';
import placesRoutes from './places/routes';
import {startInvitationStatusCron} from "./business/cron";
import {startBillingCron} from "./billing/cron";

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL
}));

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false
});

app.use(globalLimiter);

// app.use('/billing', billingRoutes);

app.use(express.json());

app.get('/status', (_, res) => {
    res.json({
        status: 'Running',
        timestamp: new Date().toISOString()
    });
});

app.use('/', authRoutes);
app.use('/group', groupRoutes);
app.use('/event', eventRoutes);
// app.use('/business', businessRoutes);
app.use('/places', placesRoutes);

startInvitationStatusCron();
startBillingCron();

app.use((err: Error, _: Request, res: Response, __: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Something went wrong'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
