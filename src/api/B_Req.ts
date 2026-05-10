import express from 'express';
import { 
    getallB_Reqs, 
    getB_ReqById, 
    createB_Req, 
    updateB_Req, 
    deleteB_ReqbyId,
    uploadProductImage
} from '../application/B_Req';
import { handleIncomingMessage } from "../infrastructure/whatsapp/chatHandler";
import { runRiskEscalationCheck } from '../application/riskAlert.schedular'; 
const B_ReqRouter = express.Router();

B_ReqRouter
    .route('/')
    .get(getallB_Reqs)
    .post(createB_Req);

B_ReqRouter.post('/images', uploadProductImage);

// Test risk alerts manually
B_ReqRouter.get("/test-risk-alerts", async (req, res, next) => {
  try {
    await runRiskEscalationCheck();
    res.json({ message: " Risk check complete" });
  } catch (err) { next(err); }
});

B_ReqRouter
    .route('/:id')
    .get(getB_ReqById)
    .put(updateB_Req)
    .delete(deleteB_ReqbyId);


export default B_ReqRouter;
