import argon2 from 'argon2';
import db from './database.js';

// Utilisateurs de test
const users = [
  { firstName: 'Admin', lastName: 'User', email: 'admin@example.com', password: 'adminpass', role: 1 },
  { firstName: 'Jean', lastName: 'Dupont', email: 'jean@example.com', password: 'jeanpass', role: 2 },
];

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (first_name, last_name, email, password_hash, role)
  VALUES (@firstName, @lastName, @email, @passwordHash, @role)
`);

try {
  for (const { password, ...user } of users) {
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const { changes } = insertUser.run({ ...user, passwordHash });
    console.log(changes ? `Ajouté : ${user.email}` : `Déjà présent : ${user.email}`);
  }
} catch (err) {
  console.error('Échec du seed :', err.message);
  process.exitCode = 1;
} finally {
  db.close();
}
