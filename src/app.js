import express from 'express';
import authRoutes from './routes/auth.routes.js';

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(authRoutes);

// Erreur global
app.use((err, req, res, next) => {
  // Réponse déjà partiellement envoyée
  if (res.headersSent) {
    return next(err);
  }

  // Erreurs client
  if (err.status >= 400 && err.status < 500) {
    return res.status(400).json({ status: 400, message: 'Error' });
  }

  // Erreur inattendue
  console.error(err?.stack ?? String(err));
  return res.status(500).json({ status: 500, message: 'Server error' });
});

export default app;
