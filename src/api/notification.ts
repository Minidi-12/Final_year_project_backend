import express from 'express';
import {
    getAllNotifications,
    getNotificationById,
    createNotification,
    updateNotification,
    deleteNotificationById
} from '../application/notification';

const notificationRouter = express.Router();

notificationRouter
    .route('/')
    .get(getAllNotifications)
    .post(createNotification);

notificationRouter
    .route('/:id')
    .get(getNotificationById)
    .put(updateNotification)
    .delete(deleteNotificationById);

export default notificationRouter;