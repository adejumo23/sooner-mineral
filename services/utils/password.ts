import crypto from 'crypto';

/**
 * Hash a password using MD5
 */
export const hashPassword = (password: string): string => {
  return crypto.createHash('md5').update(password).digest('hex');
};

/**
 * Verify a password against an MD5 hash
 */
export const verifyPassword = (password: string, hashedPassword: string): boolean => {
  const passwordHash = hashPassword(password);
  return passwordHash === hashedPassword;
};

