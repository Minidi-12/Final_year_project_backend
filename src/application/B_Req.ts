import { Request, Response, NextFunction } from "express";
import B_Reqdto from "../domain/dto/B_Reqdto";
import ValidationError from "../domain/errors/validation-error";
import NotFoundError from "../domain/errors/not-found-error";
import B_Req from "../infrastructure/db/entities/B_Req";
import { randomUUID } from "crypto";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import S3 from "../infrastructure/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import {
  notifyRequestSubmitted,
  notifyStatusChanged,
  notifyRequestVerified,
  notifyRequestResolved,
} from "../infrastructure/whatsapp/notificationService";

const getallB_Reqs = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const b_reqs = await B_Req.find()
      .populate("gn_division_Id")
      .populate("Predictions")
      .populate("req_evidence");
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
      .populate("Predictions")
      .populate("req_evidence");
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

    await notifyRequestSubmitted(createdB_Req._id);

    res.status(201).json(createdB_Req);
  } catch (error) {
    next(error);
  }
};

const updateB_Req = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existingReq = await B_Req.findById(req.params.id);
    if (!existingReq) {
      throw new NotFoundError("Beneficiary Request not found");
    }

    const { status, gn_verified, gn_notes, admin_notes, updated_at } = req.body;

    const updatedB_req = await B_Req.findByIdAndUpdate(
      req.params.id,
      { status, gn_verified, gn_notes, admin_notes, updated_at },
      { new: true },
    );

    if (!updatedB_req) {
      throw new NotFoundError("Beneficiary Request not found");
    }

    const newStatus = status;
    if (newStatus && newStatus !== existingReq.status) {
      if (newStatus === "verified") {
        await notifyRequestVerified(updatedB_req._id);
      } else if (newStatus === "resolved") {
        await notifyRequestResolved(updatedB_req._id);
      } else {
        await notifyStatusChanged(updatedB_req._id, newStatus);
      }
    }

    res.status(200).json(updatedB_req);
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

const uploadProductImage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = req.body;
    const { fileType } = body;

    const id = randomUUID();

    const url = await getSignedUrl(
      S3,
      new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
        Key: id,
        ContentType: fileType,
      }),
      {
        expiresIn: 60,
      },
    );

    res.status(200).json({
      url,
      publicURL: `${process.env.CLOUDFLARE_PUBLIC_DOMAIN}/${id}`,
    });
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
  uploadProductImage,
};
