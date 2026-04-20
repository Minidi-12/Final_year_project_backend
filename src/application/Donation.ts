import { Request, Response, NextFunction } from "express";
import Donationdto from "../domain/dto/Donationdto";
import ValidationError from "../domain/errors/validation-error";
import NotFoundError from "../domain/errors/not-found-error";
import Donation from "../infrastructure/db/entities/Donation";

const getallDonations = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const donations = await Donation.find().populate("project_id");
        res.status(200).json(donations);
    } catch (error) {
        next(error);
    }
}

const getDonationById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const donation = await Donation.findById(req.params.id).populate("project_id");
        if (!donation) {
            throw new NotFoundError("Donation not found");
        }
        res.status(200).json(donation);
    } catch (error) {
        next(error);
    }
}

const createDonation = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const donationData = Donationdto.parse(req.body);
        const donation = new Donation(donationData);
        await donation.save();
        res.status(201).json(donation);
    } catch (error) {
        if (error instanceof ValidationError) {
            res.status(400).json({ error: error.message });
        } else {
            next(error);
        }
    }
}

const updateDonation = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const donationData = Donationdto.parse(req.body);
        const donation = await Donation.findByIdAndUpdate(req.params.id, donationData, { new: true }).populate("project_id");
        if (!donation) {
            throw new NotFoundError("Donation not found");
        }
        res.status(200).json(donation);
    } catch (error) {
        if (error instanceof ValidationError) {
            res.status(400).json({ error: error.message });
        } else {
            next(error);
        }
    }
}

const deleteDonationById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const donation = await Donation.findByIdAndDelete(req.params.id);
        if (!donation) {
            throw new NotFoundError("Donation not found");
        }
        res.status(200).json({ message: "Donation deleted successfully" });
    } catch (error) {
        next(error);
    }
}

export {
    getallDonations,
    getDonationById,
    createDonation,
    updateDonation,
    deleteDonationById
};