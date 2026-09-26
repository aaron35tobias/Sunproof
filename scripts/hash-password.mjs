// Prints the SHA-256 hash of a password for VITE_SUPERVISOR_PASSWORD_HASH in .env.
// Usage: npm run hash-password -- "your-password"
import { createHash } from 'node:crypto';

const password = process.argv[2];
if (!password) {
  console.error('Usage: npm run hash-password -- "your-password"');
  process.exit(1);
}
console.log(createHash('sha256').update(password).digest('hex'));
