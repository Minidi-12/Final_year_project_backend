import express from 'express';
import 'dotenv/config';
import connectDB from './infrastructure/db';

const app = express();
app.use(express.json());

connectDB();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 