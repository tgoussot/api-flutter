import express from 'express';

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

export default app;
