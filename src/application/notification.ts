import { Request, Response, NextFunction } from "express";
import Notification from "../infrastructure/db/entities/notification";
import ValidationError from "../domain/errors/validation-error";

const getAllNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const notifications = await Notification.find().populate("requestId");
    res.status(200).json(notifications);
  } catch (error) {
    next(error);
  }
};

const getNotificationById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const notification = await Notification.findById(req.params.id).populate("requestId");
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.status(200).json(notification);
  } catch (error) {
    next(error);
  }
};

const createNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const notificationData = req.body;
    if (!notificationData.name) {
      throw new ValidationError("Notification name is required");
    }
    await Notification.create(notificationData);
    res.status(201).json(notificationData);
  } catch (error) {
    next(error);
  }
};

const updateNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const notificationData = req.body;
    if (!notificationData.name) {
      throw new ValidationError("Notification name is required");
    }
    const notification = await Notification.findByIdAndUpdate(req.params.id, notificationData, { new: true });
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.status(200).json(notification);
  } catch (error) {
    next(error);
  }
};

const deleteNotificationById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export {
  getAllNotifications,
  getNotificationById,
  createNotification,
  updateNotification,
  deleteNotificationById
};