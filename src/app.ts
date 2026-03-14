import express, {NextFunction, Request, Response} from 'express';
import cors from 'cors';
require('dotenv').config();

import authRoutes from './auth/routes';

const app = express();

const pg = require('knex')({
    client: 'pg',
    connection: process.env.PG_CONNECTION_STRING,
    searchPath: ['knex', 'public'],
});

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
