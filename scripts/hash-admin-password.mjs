// Generates a bcrypt hash for the admin panel password, so the plaintext
// password never has to be typed anywhere except your own terminal.
//
// Usage: node scripts/hash-admin-password.mjs "your-password-here"
// Paste the printed hash into ADMIN_PASSWORD_HASH in your local .env
// (and in Vercel's Environment Variables for production).

import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/hash-admin-password.mjs \"your-password\"");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
console.log(hash);
