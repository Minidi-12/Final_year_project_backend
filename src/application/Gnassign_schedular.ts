import cron from "node-cron";
import mongoose from "mongoose";
import B_Req from "../infrastructure/db/entities/B_Req";
import Gn_Division from "../infrastructure/db/entities/Gn_Division";
import GnOfficer from "../infrastructure/db/entities/Gnofficer";
import { sendWhatsApp } from "../infrastructure/whatsapp/twilioClient";
import { templates } from "../infrastructure/whatsapp/messageTemplates";
import Notification from "../infrastructure/db/entities/notification";

export const runGnAssignment = async () => {
  console.log(" [Cron] Running GN Assignment Job...");

  const month = new Date().toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const pendingRequests = await B_Req.find({ status: "pending" });

  if (pendingRequests.length === 0) {
    console.log(" [Cron] No pending requests found.");
    return;
  }

  const byDivision = new Map<string, typeof pendingRequests>();

  for (const req of pendingRequests) {
    if (!req.gn_division_Id) continue;
    const key = req.gn_division_Id.toString();
    if (!byDivision.has(key)) byDivision.set(key, []);
    byDivision.get(key)!.push(req);
  }

  for (const [divisionId, requests] of Array.from(byDivision.entries())) {
    const gnDivision = await Gn_Division.findById(divisionId);

    const officer = await GnOfficer.findOne({
      gn_division_id: new mongoose.Types.ObjectId(divisionId),
      isActive: true,
    });

    const reqIds = requests.map((r: (typeof pendingRequests)[number]) => r._id);

    await B_Req.updateMany(
      { _id: { $in: reqIds } },
      {
        $set: {
          status: "gn_assigned",
          updated_at: new Date(),
        },
      }
    );

    for (const req of requests) {
      const profile = req.b_profile[0];
      const notifMsg = templates.gnAssigned(
        profile.name,
        req._id.toString(),
        gnDivision?.gn_division_Name || "your area"
      );

      await Notification.create({
        requestId: req._id,
        type: "gn_assigned",
        message: notifMsg,
      });

      await sendWhatsApp(profile.phone_no, notifMsg);
    }

    if (officer) {
      const officerMsg = templates.gnOfficerAssigned(
        officer.name,
        requests.length,
        gnDivision?.gn_division_Name || "your division",
        month
      );
      await sendWhatsApp(officer.phone_no, officerMsg);
      console.log(` [Cron] Notified officer: ${officer.name}`);
    } else {
      console.warn(
        ` [Cron] No active GN Officer found for division: ${gnDivision?.gn_division_Name}`
      );
    }

    console.log(
      ` [Cron] Division: ${gnDivision?.gn_division_Name} — ${requests.length} request(s) assigned`
    );
  }

  console.log(" [Cron] GN Assignment Job completed.");
};

export const startGnAssignmentScheduler = () => {
  cron.schedule("0 9 15 * *", async () => {
    try {
      await runGnAssignment();
    } catch (error) {
      console.error(" [Cron] GN Assignment Job failed:", error);
    }
  });

  console.log(" GN Assignment Scheduler registered (15th of every month, 9:00 AM)");
};