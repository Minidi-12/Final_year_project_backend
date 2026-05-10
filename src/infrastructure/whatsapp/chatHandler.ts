import { sendWhatsApp } from "./twilioClient";
import { getSession, setSession, clearSession } from "./sessionStore";
import B_Req from "../db/entities/B_Req";

// Intent detection (simple NLP keyword matching)
const detectIntent = (text: string): string => {
  const t = text.toLowerCase().trim();

  // Status check intents
  if (t.match(/\b(status|check|request|my request|where|update)\b/)) return "CHECK_STATUS";
  if (t.match(/\b(hi|hello|help|start|menu|helo|hai)\b/))             return "GREETING";
  if (t.match(/\b(reference|ref|number|id)\b/))                       return "ASK_REF";
  if (t.match(/\b(nic|national|identity|card)\b/))                    return "ASK_NIC";
  if (t.match(/^[0-9]{9}[vVxX]$|^[0-9]{12}$/))                      return "IS_NIC";
  if (t.match(/^REF-\d{4}-\d{5}$/i))                                  return "IS_REF";
  if (t.match(/\b(cancel|stop|quit|exit|bye)\b/))                     return "CANCEL";

  return "UNKNOWN";
};

const MENU = ` *Welcome to HopeConnect Support!*\n\nHow can I help you today?\n\n 1. Check request status\n 2. Get help\n\nReply with a number or type your question.`;

// Main handler
export const handleIncomingMessage = async (from: string, body: string) => {
  const phone  = from.replace("whatsapp:", "");
  const session = getSession(from);
  const intent  = detectIntent(body);
  const text    = body.trim();

  // CANCEL anytime
  if (intent === "CANCEL") {
    clearSession(from);
    return sendWhatsApp(phone, " Session ended. Text *hi* anytime to start again.\n\n_HopeConnect Foundation_");
  }

  // MENU / GREETING
  if (session.step === "MENU" || intent === "GREETING") {
    if (text === "1" || intent === "CHECK_STATUS") {
      setSession(from, "AWAIT_NIC_OR_REF");
      return sendWhatsApp(phone,
        ` *Request Status Check*\n\nPlease send your:\n *NIC Number* (e.g. 199012345678)\n— or —\n *Reference ID* (e.g. 69ffaa25bb3a92c650dfa8f2)`
      );
    }
    if (text === "2") {
      return sendWhatsApp(phone,
        ` *HopeConnect Help*\n\n` +
        `• Type *check status* — to check your request\n` +
        `• Type *hi* — to see the main menu\n` +
        `• Type *stop* — to end the session\n\n` +
        `For urgent help contact your local GN Officer.\n\n_HopeConnect Foundation_`
      );
    }
    return sendWhatsApp(phone, MENU);
  }

  // WAITING FOR NIC OR REFERENCE NUMBER 
  if (session.step === "AWAIT_NIC_OR_REF") {

    // User sent a NIC number
    if (intent === "IS_NIC") {
      const req = await B_Req.findOne({ "b_profile.nic": text }).sort({ created_at: -1 });
      clearSession(from);

      if (!req) {
        return sendWhatsApp(phone,
          ` *No request found*\n\nWe couldn't find a request linked to NIC *${text}*.\n\nPlease check your NIC and try again, or contact your GN Officer.\n\n_HopeConnect Foundation_`
        );
      }
      return sendWhatsApp(phone, buildStatusMessage(req));
    }

    // User sent a Reference ID
    if (intent === "IS_REF") {
      const req = await B_Req.findOne({ reference_no: text.toUpperCase() });
      clearSession(from);

      if (!req) {
        return sendWhatsApp(phone,
          ` *Reference not found*\n\nNo request found for *${text}*.\n\nType *hi* to try again.\n\n_HopeConnect Foundation_`
        );
      }
      return sendWhatsApp(phone, buildStatusMessage(req));
    }

    // Not a valid NIC or ref
    return sendWhatsApp(phone,
      ` *Invalid format*\n\nPlease send:\n` +
      `• NIC: 12 digits (199012345678) or 9 digits + V/X (901234567V)\n` +
      `• Reference: REF-2025-00123\n\nOr type *cancel* to go back.`
    );
  }

  //FALLBACK 
  clearSession(from);
  return sendWhatsApp(phone, MENU);
};

// Format status message
const buildStatusMessage = (req: any): string => {
  const profile = req.b_profile?.[0];
  const statusEmoji: Record<string, string> = {
    pending:     " Pending",
    gn_assigned: " GN Officer Assigned",
    verified:    " Verified",
    flagged:     " Under Review",
    resolved:    " Resolved",
    rejected:    " Rejected",
  };

  const urgencyEmoji: Record<string, string> = {
    high:     " High",
    moderate: " Moderate",
    stable:   " Stable",
  };

  const status  = statusEmoji[req.status]  || req.status;
  const urgency = urgencyEmoji[req.urgency_label?.toLowerCase()] || req.urgency_label || "Not assessed";
  const date    = new Date(req.created_at).toLocaleDateString("en-GB");

  return (
    ` *Your Request Status*\n\n` +
    ` *Name:* ${profile?.name || "—"}\n` +
    ` *Reference:* ${req.reference_no || req._id}\n` +
    ` *Submitted:* ${date}\n` +
    ` *Status:* ${status}\n` +
    ` *Urgency:* ${urgency}\n` +
    ` *Division:* ${profile?.gn_division || "—"}\n\n` +
    `${getStatusAdvice(req.status)}\n\n` +
    `_Type *hi* for main menu_`
  );
};

const getStatusAdvice = (status: string): string => {
  const advice: Record<string, string> = {
    pending:     " Your request is in the queue. A GN Officer will be assigned soon.",
    gn_assigned: " A GN Officer has been assigned and will contact you for verification.",
    verified:    " Your request has been verified. The NGO is reviewing your case.",
    flagged:     " Your case needs additional information. An officer will contact you.",
    resolved:    " Great news! Support has been arranged for your family.",
    rejected:    " Your request was not approved. Contact your GN Officer for details.",
  };
  return advice[status] || "";
};