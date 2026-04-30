import { Request, Response, NextFunction } from "express";
import B_Reqdto from "../domain/dto/B_Reqdto";
import ValidationError from "../domain/errors/validation-error";
import NotFoundError from "../domain/errors/not-found-error";
import B_Req from "../infrastructure/db/entities/B_Req";

const getallB_Reqs = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const b_reqs = await B_Req.find()
      .populate("gn_division_Id")
      .populate("Predictions");
    res.status(200).json(b_reqs);
  } catch (error) {
    next(error);
  }
};

const getB_ReqById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const b_req = await B_Req.findById(req.params.id)
      .populate("gn_division_Id")
      .populate("Predictions");
    if (!b_req) {
      throw new NotFoundError("Beneficiary Request not found");
    }
    res.status(200).json(b_req);
  } catch (error) {
    next(error);
  }
};

const createB_Req = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    const newb_req = B_Reqdto.safeParse(req.body);
    if (!newb_req.success) {
      console.error("Validation errors:", newb_req.error.issues);
      throw new ValidationError(newb_req.error.issues[0].message);
    }

    console.log("Validated data:", JSON.stringify(newb_req.data, null, 2));
    console.log("req_evidence in validated data:", newb_req.data.req_evidence);

    const createdB_Req = await B_Req.create(newb_req.data);
    console.log("Saved B_Req:", JSON.stringify(createdB_Req, null, 2));

    res.status(201).json(createdB_Req);
  } catch (error) {
    next(error);
  }
};

const updateB_Req = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updatedb_req = await B_Req.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    if (!updatedb_req) {
      throw new NotFoundError("Beneficiary Request not found");
    }
    res.status(200).json(updatedb_req);
  } catch (error) {
    next(error);
  }
};

const deleteB_ReqbyId = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const deletedb_req = await B_Req.findByIdAndDelete(req.params.id);
    if (!deletedb_req) {
      throw new NotFoundError("Beneficiary Request not found");
    }
    res
      .status(200)
      .json({ message: "Beneficiary Request deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export {
  getallB_Reqs,
  getB_ReqById,
  createB_Req,
  updateB_Req,
  deleteB_ReqbyId,
};
