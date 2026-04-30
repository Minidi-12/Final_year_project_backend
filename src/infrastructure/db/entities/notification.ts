import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "B_Req",
      required: true,
    },
  type: {
    type: String,
    required: true,
    enum: ["request_submitted", "gn_assigned", "request_verified", "request_rejected", "request_resolved","request_declined",
          "high_urgency_alert","ml_completed","donation_confirmed","donation_failed","volunteer_approved","project_started",
          "project_completed","verification_due"],
  },
  message: {
    type: String,
    required: true,
  },
  isread: {
    type: Boolean,
    default: false,
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const Notification = mongoose.model("Notification", NotificationSchema);
export default Notification;