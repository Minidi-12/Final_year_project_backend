import { Request, Response, NextFunction } from "express";
import gn_Division from "../infrastructure/db/entities/Gn_Division";
import ValidationError from "../domain/errors/validation-error";

const getAllGn_Divisions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const gn_Divisions = await gn_Division.find();
    res.status(200).json(gn_Divisions);
  } catch (error) {
    next(error);
  }
};

const getGn_DivisionById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const foundGn_Division = await gn_Division.findById(req.params.id);
    if (!foundGn_Division) {
      return res.status(404).json({ error: "Grama_Niladari_Division not found" });
    }
    res.status(200).json(foundGn_Division);
  } catch (error) {
    next(error);
  }
};

const createGn_Division = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const gn_DivisionData = req.body;
    if (!gn_DivisionData.gn_division_Id) {
      throw new ValidationError("Grama_Niladari_Division ID is required");
    }
    const newGn_Division = await gn_Division.create(gn_DivisionData);
    res.status(201).json(newGn_Division);
  } catch (error) {
    next(error);
  }
};

const updateGn_Division = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const gn_DivisionData = req.body;
    if (!gn_DivisionData.gn_division_Id) {
      throw new ValidationError("Grama_Niladari_Division ID is required");
    }
    const updatedGn_Division = await gn_Division.findByIdAndUpdate(req.params.id, gn_DivisionData, { new: true });
    if (!updatedGn_Division) {
      return res.status(404).json({ error: "Grama_Niladari_Division not found" });
    }
    res.status(200).json(updatedGn_Division);
  } catch (error) {
    next(error);
  }
};

const deleteGn_DivisionById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const deletedGn_Division = await gn_Division.findByIdAndDelete(req.params.id);
    if (!deletedGn_Division) {
      return res.status(404).json({ error: "Grama_Niladari_Division not found" });
    }
    res.status(200).json({ message: "Grama_Niladari_Division deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export {
  getAllGn_Divisions,
  getGn_DivisionById,
  createGn_Division,
  updateGn_Division,
  deleteGn_DivisionById
};

