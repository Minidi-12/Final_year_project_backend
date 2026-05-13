import cron from "node-cron";
import B_Req from "../infrastructure/db/entities/B_Req";
import User from "../infrastructure/db/entities/User";
import GnOfficer from "../infrastructure/db/entities/Gnofficer";
import { sendWhatsApp } from "../infrastructure/whatsapp/twilioClient";

const CRITICAL_THRESHOLD = 90;
const WORSENING_THRESHOLD = 15; 

interface RiskCase {
  name:      string;
  reference: string;
  division:  string;
  phone:     string;
  current:   number;
  predicted: number;
  trend:     number;
}

export const runRiskEscalationCheck = async () => {
  console.log(" [Risk Alert] Running escalation check...");

  const atRiskCases = await B_Req.find({
    status:      { $in: ["pending", "gn_assigned"] },
    "Predictions.0": { $exists: true },
  });

  const escalations: RiskCase[] = [];

  for (const req of atRiskCases) {
    const profile    = req.b_profile?.[0];
    const current    = req.urgency_score ?? 0;
    const predictions = req.Predictions || [];

    const futureScores = predictions
      .filter((p: any) => p.month >= 2)
      .map((p: any) => p.score ?? 0);

    if (futureScores.length === 0) continue;

    const maxPredicted = Math.max(...futureScores);
    const trend        = maxPredicted - current;

    const willBecomeCritical = maxPredicted >= CRITICAL_THRESHOLD;
    const isWorsening        = trend >= WORSENING_THRESHOLD;
    const isAlreadyHigh      = current >= 70;

    if (willBecomeCritical || (isWorsening && isAlreadyHigh)) {
      escalations.push({
        name:      profile?.name     || "Unknown",
        reference: req.reference_no  || req._id.toString(),
        division:  profile?.gn_division || "Unknown",
        phone:     profile?.phone_no || "",
        current,
        predicted: maxPredicted,
        trend,
      });
    }
  }

  if (escalations.length === 0) {
    console.log(" [Risk Alert] No escalations detected.");
    return;
  }

  console.log(` [Risk Alert] Found ${escalations.length} at-risk cases`);

  escalations.sort((a, b) => b.predicted - a.predicted);

  await notifyAdmin(escalations);

  for (const c of escalations) {
    if (c.phone) {
      await notifyBeneficiary(c);
    }
  }

  console.log(" [Risk Alert] Escalation alerts sent.");
};

const notifyAdmin = async (cases: RiskCase[]) => {
  const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER || "";
  if (!adminPhone) {
    console.warn(" ADMIN_WHATSAPP_NUMBER not set in .env");
    return;
  }

  const top3 = cases.slice(0, 3);
  const caseList = top3.map((c, i) =>
    `${i + 1}. *${c.name}* (${c.reference})\n` +
    `    ${c.division} · Score: ${c.current} → ${c.predicted} (+${c.trend})`
  ).join("\n\n");

  const msg =
    ` *HopeConnect Risk Alert*\n\n` +
    ` *${cases.length} case(s)* predicted to reach critical urgency.\n\n` +
    `*Top Priority Cases:*\n\n${caseList}\n\n` +
    `${cases.length > 3 ? `...and ${cases.length - 3} more cases\n\n` : ""}` +
    `Please log in to review these cases immediately.\n` +
    `🔗 Dashboard: http://localhost:5173/dashboard\n\n` +
    `_HopeConnect Automated Risk System`;

  await sendWhatsApp(adminPhone, msg);
  console.log(` [Risk Alert] Admin notified at ${adminPhone}`);
};

const notifyBeneficiary = async (c: RiskCase) => {
  const msg =
    ` *Important Update — HopeConnect*\n\n` +
    `Dear ${c.name},\n\n` +
    `Our system has detected that your situation may become more urgent soon. ` +
    `To ensure you receive timely support, please make sure your contact details are up to date.\n\n` +
    ` *Reference:* ${c.reference}\n` +
    ` *Division:* ${c.division}\n\n` +
    `If your situation has worsened, please contact your GN Officer immediately.\n\n` +
    `_HopeConnect Foundation`;

  await sendWhatsApp(c.phone, msg);
};

export const startRiskAlertScheduler = () => {
  cron.schedule("0 8 * * *", async () => {
    try {
      await runRiskEscalationCheck();
    } catch (err) {
      console.error(" [Risk Alert] Failed:", err);
    }
  });
  console.log(" Risk Alert Scheduler registered (daily at 8:00 AM)");
};