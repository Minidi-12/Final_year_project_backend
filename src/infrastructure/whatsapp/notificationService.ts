import { sendWhatsApp } from "./twilioClient";
import { templates } from "./messageTemplates";
import Notification from "../db/entities/notification";
import B_Req from "../db/entities/B_Req";
import Gn_Division from "../db/entities/Gn_Division";
import mongoose from "mongoose";

const saveNotification = async (
  requestId: mongoose.Types.ObjectId,
  type: string,
  message: string
) => {
  await Notification.create({ requestId, type, message });
};

export const notifyRequestSubmitted = async (reqId: mongoose.Types.ObjectId) => {
  const req = await B_Req.findById(reqId);
  if (!req) return;

  const profile = req.b_profile[0];
  const message = templates.requestSubmitted(profile.name, reqId.toString());

  await sendWhatsApp(profile.phone_no, message);
  await saveNotification(reqId, "request_submitted", message);
};


export const notifyStatusChanged = async (
  reqId: mongoose.Types.ObjectId,
  newStatus: string
) => {
  const req = await B_Req.findById(reqId);
  if (!req) return;

  const profile = req.b_profile[0];

  // Route to specific notification type for gn_assigned, verified, resolved
  if (newStatus === "gn_assigned") {
    return notifyGnAssigned(reqId);
  }
  if (newStatus === "verified") {
    return notifyRequestVerified(reqId);
  }
  if (newStatus === "resolved") {
    return notifyRequestResolved(reqId);
  }

  // Generic status update for flagged, rejected, etc.
  const notifTypeMap: Record<string, string> = {
    flagged:  "request_rejected",
    rejected: "request_rejected",
    pending:  "request_submitted",
  };

  const message = templates.statusChanged(
    profile.name,
    reqId.toString(),
    newStatus
  );

  await sendWhatsApp(profile.phone_no, message);
  await saveNotification(reqId, notifTypeMap[newStatus] || "request_submitted", message);
};


export const notifyGnAssigned = async (reqId: mongoose.Types.ObjectId) => {
  const req = await B_Req.findById(reqId).populate("gn_division_Id");
  if (!req) return;

  const profile = req.b_profile[0];
  const gnName = (req.gn_division_Id as any)?.gn_division_Name || "your area";
  const message = templates.gnAssigned(profile.name, reqId.toString(), gnName);

  await sendWhatsApp(profile.phone_no, message);
  await saveNotification(reqId, "gn_assigned", message);
};


export const notifyRequestVerified = async (reqId: mongoose.Types.ObjectId) => {
  const req = await B_Req.findById(reqId);
  if (!req) return;

  const profile = req.b_profile[0];
  const message = templates.requestVerified(profile.name, reqId.toString());

  await sendWhatsApp(profile.phone_no, message);
  await saveNotification(reqId, "request_verified", message);
};


export const notifyRequestResolved = async (reqId: mongoose.Types.ObjectId) => {
  const req = await B_Req.findById(reqId);
  if (!req) return;

  const profile = req.b_profile[0];
  const message = templates.requestResolved(profile.name, reqId.toString());

  await sendWhatsApp(profile.phone_no, message);
  await saveNotification(reqId, "request_resolved", message);
};