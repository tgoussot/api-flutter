import argon2 from 'argon2';
import db from '../db/database.js';

const EMAIL_MAX_LENGTH = 254;
const PASSWORD_MAX_LENGTH = 128;

// Format email valid
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sendError = (res) => res.status(400).json({ status: 400, message: 'Error' });

const findUserByEmail = db.prepare(`
  SELECT id, first_name, last_name, email, password_hash, role
  FROM users
  WHERE email = ?
`);

export async function login(req, res) {
  const { email, password } = req.body ?? {};

  if (typeof email !== 'string' || typeof password !== 'string') {
    return sendError(res);
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (
    normalizedEmail.length === 0 ||
    normalizedEmail.length > EMAIL_MAX_LENGTH ||
    !EMAIL_REGEX.test(normalizedEmail) ||
    password.length === 0 ||
    password.length > PASSWORD_MAX_LENGTH
  ) {
    return sendError(res);
  }

  const user = findUserByEmail.get(normalizedEmail);
  if (!user) {
    return sendError(res);
  }

  const isValid = await argon2.verify(user.password_hash, password);
  if (!isValid) {
    return sendError(res);
  }

  return res.status(200).json({
    status: 200,
    message: 'Success',
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    role: user.role,
  });
}
