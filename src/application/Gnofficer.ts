import { Request, Response, NextFunction } from "express";
import GnOfficer from "../infrastructure/db/entities/Gnofficer";
import ValidationError from "../domain/errors/validation-error";
import NotFoundError from "../domain/errors/not-found-error";

const getAllGn_Officers = async (
  req: Request,
  res: Response,
  next: NextFunction
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
  next: NextFunction
) => {
  try {
    const foundGnOfficer = await GnOfficer.findById(req.params.id).populate("gn_division_id");
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
  next: NextFunction
) => {
  try {
    const gnOfficerData = req.body;
    if (!gnOfficerData.name) {
      throw new ValidationError("Officer name is required");
    }
    if (!gnOfficerData.phone_no) {
      throw new ValidationError("Phone number is required");
    }
    if (!gnOfficerData.gn_division_id) {
      throw new ValidationError("GN Division is required");
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
  next: NextFunction
) => {
  try {
    const updatedGnOfficer = await GnOfficer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
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
  next: NextFunction
) => {
  try {
    const deletedGnOfficer = await GnOfficer.findByIdAndDelete(req.params.id);
    if (!deletedGnOfficer) {
      throw new NotFoundError("GN Officer not found");
    }
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