import { PrismaClient } from './generated/prisma/client.js';
import dotenv from 'dotenv';
dotenv.config();
// import path from 'path';

// Load .env from the backend root directory
// dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const prisma = new PrismaClient();

console.log("Database URL loaded:", process.env.DATABASE_URL ? "Yes" : "No");
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
export default prisma;