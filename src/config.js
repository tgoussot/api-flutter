import 'dotenv/config';

const JWT_SECRET_MIN_LENGTH = 32;

const jwtSecret = process.env.JWT_SECRET;

if (typeof jwtSecret !== 'string' || jwtSecret.length < JWT_SECRET_MIN_LENGTH) {
  console.error(
    `Erreur de configuration : JWT_SECRET est absent ou fait moins de ${JWT_SECRET_MIN_LENGTH} caractères. Définissez-le dans l'environnement (voir .env.example).`
  );
  process.exit(1);
}

export const JWT_SECRET = jwtSecret;
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
