import express from 'express';
import authRoutes from './routes/auth.routes.js';

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(authRoutes);

export default app;
