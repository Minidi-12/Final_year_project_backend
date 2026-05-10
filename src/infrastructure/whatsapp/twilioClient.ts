import twilio from "twilio";
import dotenv from "dotenv";
dotenv.config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

/**
 * @param toPhone 
 * @param message 
 */
export const sendWhatsApp = async (
  toPhone: string,
  message: string
): Promise<void> => {
  try {
    const normalized = toPhone.startsWith("+")
      ? `whatsapp:${toPhone}`
      : `whatsapp:+94${toPhone.substring(1)}`;

    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER!,
      to: normalized,
      body: message,
    });

    console.log(` WhatsApp sent to ${normalized}`);
  } catch (error) {
    // Log but don't crash the app if WhatsApp fails
    console.error(` WhatsApp failed to ${toPhone}:`, error);
  }
};