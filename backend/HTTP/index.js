import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes/router.js';
import path from "path";
// Global first
dotenv.config({
  path: path.resolve(process.cwd(), "../config/.env")
});

// WS-specific
dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
  override: true
});
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

app.use("/", router);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})