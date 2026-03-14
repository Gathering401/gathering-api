import express, {NextFunction, Request, Response} from 'express';
import cors from 'cors';
require('dotenv').config();

import authRoutes from './auth/routes';
import groupRoutes from './group/routes';

const app = express();

require('knex')({
    client: 'pg',
    connection: process.env.PG_CONNECTION_STRING,
    searchPath: ['knex', 'public'],
});

app.set('trust proxy', 1);
app.use(express.json());
app.use(cors());

app.get('/status', (_, res) => {
    res.json({
        status: 'Running',
        timestamp: new Date().toISOString()
    });
});

app.use((err: Error, _: Request, res: Response, __: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Something went wrong'
    });
});

app.use('/', authRoutes);
app.use('/group', groupRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
