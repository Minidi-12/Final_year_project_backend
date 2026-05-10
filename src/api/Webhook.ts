import express from "express";
import { handleIncomingMessage } from "../infrastructure/whatsapp/chatHandler";

const webhookRouter = express.Router();

// Twilio sends POST when user messages your bot
webhookRouter.post("/whatsapp/incoming", async (req, res) => {
  const from: string = req.body.From;  
  const body: string = req.body.Body;  

  console.log(` Incoming WhatsApp from ${from}: "${body}"`);

  try {
    await handleIncomingMessage(from, body);
  } catch (err) {
    console.error("Chat handler error:", err);
  }

  // Twilio needs 200 OK immediately
  res.status(200).send("<Response></Response>");
});

webhookRouter.post("/test-chat", async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ error: "phone and message are required" });
    }
    await handleIncomingMessage(`whatsapp:${phone}`, message);
    res.status(200).json({ success: true, message: "Processed" });
  } catch (err: any) {
    console.error("Test chat error:", err);
    res.status(500).json({ error: err.message });
  }
});

webhookRouter.post("/whatsapp/incoming", async (req, res) => {
  const from: string = req.body.From;
  const body: string = req.body.Body;

  console.log(` Incoming WhatsApp from ${from}: "${body}"`);

  // Always return 200 to Twilio immediately
  res.status(200).send("<Response></Response>");

  // Handle AFTER responding so Twilio doesn't timeout
  try {
    if (!from || !body) {
      console.error(" Missing From or Body in request");
      return;
    }
    await handleIncomingMessage(from, body);
  } catch (err: any) {
    // This will now show the REAL error in your terminal
    console.error("Chat handler error:", err.message);
    console.error(err.stack);
  }
});

export default webhookRouter;