import { Request,Response, NextFunction } from "express";
import Volunteerdto from "../domain/dto/Volunteerdto";
import ValidationError from "../domain/errors/validation-error";
import NotFoundError from "../domain/errors/not-found-error";
import Volunteer from "../infrastructure/db/entities/volunteer";

const getallVolunteers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const volunteers = await Volunteer.find().populate("project_id");
        res.status(200).json(volunteers);
    } catch (error) {
        next(error);
    }
};

const getVolunteerById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const volunteer = await Volunteer.findById(req.params.id).populate("project_id");
        if (!volunteer) {
            throw new NotFoundError("Volunteer not found");
        }
        res.status(200).json(volunteer);
    } catch (error) {
        next(error);
    }
};

const createVolunteer = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const volunteerData = Volunteerdto.parse(req.body);
        const volunteer = await Volunteer.create(volunteerData);
        res.status(201).json(volunteer);
    } catch (error) {
        if (error instanceof ValidationError) {
            res.status(400).json({ error: error.message });
        } else {
            next(error);
        }
    }
};

const updateVolunteer = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const volunteerData = Volunteerdto.parse(req.body);
        const volunteer = await Volunteer.findByIdAndUpdate(req.params.id, volunteerData, { new: true });
        if (!volunteer) {
            throw new NotFoundError("Volunteer not found");
        }
        res.status(200).json(volunteer);
    } catch (error) {
        if (error instanceof ValidationError) {
            res.status(400).json({ error: error.message });
        } else {
            next(error);
        }
    }
};

const deleteVolunteerById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const volunteer = await Volunteer.findByIdAndDelete(req.params.id);
        if (!volunteer) {
            throw new NotFoundError("Volunteer not found");
        }
        res.status(200).json({ message: "Volunteer deleted successfully" });
    } catch (error) {
        next(error);
    }
};

export { 
    getallVolunteers, 
    getVolunteerById, 
    createVolunteer, 
    updateVolunteer, 
    deleteVolunteerById 
};
