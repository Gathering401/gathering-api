import express, {NextFunction, Request, Response} from 'express';

import {sequelize} from './common/database';
import {defineUser} from './common/models/User';
import authRoutes from './auth/routes';
import userRoutes from './user/routes';

const app = express();

const User = defineUser(sequelize);

sequelize.sync();

app.use(express.json());

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
app.use('/user', userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
