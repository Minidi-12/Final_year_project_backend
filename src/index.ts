import express from 'express';
import 'dotenv/config';
import connectDB from './infrastructure/db';
import B_ReqRouter from './api/B_Req';
import globalErrorHandlingMiddleware from './api/middleware/global-error-handling-middleware';
import DonationRouter from './api/Donation';
import Gn_DivisionRouter from './api/Gn_Division';
import News_postRouter from './api/News_post';
import notificationRouter from './api/notification';
import projectRouter from './api/Projects';
import volunteerRouter from './api/volunteers';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors({origin: 'http://localhost:5173'}));


app.use('/api/b_reqs', B_ReqRouter);

app.use(globalErrorHandlingMiddleware);

app.use('/api/donations', DonationRouter);

app.use('/api/gn_divisions', Gn_DivisionRouter);

app.use('/api/news_posts', News_postRouter);

app.use('/api/notifications', notificationRouter);

app.use('/api/projects', projectRouter);

app.use('/api/volunteers', volunteerRouter);

connectDB();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 