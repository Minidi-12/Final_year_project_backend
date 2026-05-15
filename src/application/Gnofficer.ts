import { Request, Response, NextFunction } from "express";
import GnOfficer from "../infrastructure/db/entities/Gnofficer";
import ValidationError from "../domain/errors/validation-error";
import NotFoundError from "../domain/errors/not-found-error";
import {
  createGnofficerSchema,
  updateGnofficerSchema,
} from "../domain/dto/Gnofficerdto";
import {
  uploadFileToS3,
  deleteFileFromS3,
  validateFile,
} from "../infrastructure/fileUpload";

const getAllGn_Officers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const GnOfficers = await GnOfficer.find().populate("gn_division_id");
    res.status(200).json(GnOfficers);
  } catch (error) {
    next(error);
  }
};

const getGn_OfficerById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const foundGnOfficer = await GnOfficer.findById(req.params.id).populate(
      "gn_division_id",
    );
    if (!foundGnOfficer) {
      throw new NotFoundError("GN Officer not found");
    }
    res.status(200).json(foundGnOfficer);
  } catch (error) {
    next(error);
  }
};

const createGn_Officer = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    let gnOfficerData = req.body;

    // Validate request body
    const validated = createGnofficerSchema.safeParse(gnOfficerData);
    if (!validated.success) {
      const errorMessage =
        (validated.error as any).errors?.[0]?.message ||
        (validated.error as any).message ||
        "Validation failed";
      throw new ValidationError(errorMessage);
    }

    // Handle file upload if present
    if ((req as any).file) {
      try {
        validateFile((req as any).file);
        const fileUrl = await uploadFileToS3(
          (req as any).file.buffer,
          (req as any).file.originalname,
          (req as any).file.mimetype,
        );
        gnOfficerData.proofFileUrl = fileUrl;
        gnOfficerData.proofFileName = (req as any).file.originalname;
      } catch (fileError: any) {
        throw new ValidationError(fileError.message);
      }
    }

    const newGnOfficer = await GnOfficer.create(gnOfficerData);
    res.status(201).json(newGnOfficer);
  } catch (error) {
    next(error);
  }
};

const updateGn_Officer = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    let updateData = req.body;

    // Validate update data
    const validated = updateGnofficerSchema.safeParse(updateData);
    if (!validated.success) {
      const errorMessage =
        (validated.error as any).errors?.[0]?.message ||
        (validated.error as any).message ||
        "Validation failed";
      throw new ValidationError(errorMessage);
    }

    // Handle file upload if present
    if ((req as any).file) {
      try {
        validateFile((req as any).file);

        // Get existing officer to delete old file if present
        const existingOfficer = await GnOfficer.findById(req.params.id);
        if (existingOfficer?.proofFileUrl) {
          await deleteFileFromS3(existingOfficer.proofFileUrl);
        }

        // Upload new file
        const fileUrl = await uploadFileToS3(
          (req as any).file.buffer,
          (req as any).file.originalname,
          (req as any).file.mimetype,
        );
        updateData.proofFileUrl = fileUrl;
        updateData.proofFileName = (req as any).file.originalname;
      } catch (fileError: any) {
        throw new ValidationError(fileError.message);
      }
    }

    const updatedGnOfficer = await GnOfficer.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true },
    );
    if (!updatedGnOfficer) {
      throw new NotFoundError("GN Officer not found");
    }
    res.status(200).json(updatedGnOfficer);
  } catch (error) {
    next(error);
  }
};

const deleteGn_OfficerById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const gnofficer = await GnOfficer.findById(req.params.id);
    if (!gnofficer) {
      throw new NotFoundError("GN Officer not found");
    }

    // Delete proof file from S3 if exists
    if (gnofficer.proofFileUrl) {
      await deleteFileFromS3(gnofficer.proofFileUrl);
    }

    const deletedGnOfficer = await GnOfficer.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "GN Officer deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export {
  getAllGn_Officers,
  getGn_OfficerById,
  createGn_Officer,
  updateGn_Officer,
  deleteGn_OfficerById,
};
