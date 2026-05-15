import express from "express";
import {
  getAllGn_Officers,
  getGn_OfficerById,
  createGn_Officer,
  updateGn_Officer,
  deleteGn_OfficerById,
} from "../application/Gnofficer";
import uploadMiddleware from "./middleware/uploadMiddleware";

const GnofficerRouter = express.Router();

GnofficerRouter.route("/")
  .get(getAllGn_Officers)
  .post(uploadMiddleware.single("proofFile"), createGn_Officer);

GnofficerRouter.route("/:id")
  .get(getGn_OfficerById)
  .put(uploadMiddleware.single("proofFile"), updateGn_Officer)
  .delete(deleteGn_OfficerById);

export default GnofficerRouter;
