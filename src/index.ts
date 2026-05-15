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
import router from './api/User';
import adminRouter from "./api/Admin";
import cors from 'cors';
import { startGnAssignmentScheduler } from './application/Gnassign_schedular';
import GnofficerRouter from './api/Gnofficer';
import webhookRouter from './api/Webhook';
import { startRiskAlertScheduler } from './application/riskAlert.schedular';

const app = express();
app.use(express.json());
app.use(cors({
  origin: 'https://h-connect.netlify.app',  
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],  
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))


app.use('/api/b_reqs', B_ReqRouter);

app.use('/api/donations', DonationRouter);

app.use('/api/gn_divisions', Gn_DivisionRouter);

app.use('/api/news_posts', News_postRouter);

app.use('/api/notifications', notificationRouter);

app.use('/api/projects', projectRouter);

app.use('/api/volunteers', volunteerRouter);

app.use('/api/auth', router);

app.use('/api/admin', adminRouter);

app.use('/api/gnofficers', GnofficerRouter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", webhookRouter);

app.use(globalErrorHandlingMiddleware);

connectDB().then(() => {
  startGnAssignmentScheduler();
  startRiskAlertScheduler();

  const PORT = process.env.PORT || 3000;    

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });                                        
});                                       