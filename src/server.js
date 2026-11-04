import './config.js';
import app from './app.js';

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`API d'authentification démarrée sur http://localhost:${PORT}`);
});
