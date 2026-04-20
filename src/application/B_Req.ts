import { Request,Response,NextFunction } from "express";
import B_Reqdto from "../domain/dto/B_Reqdto";
import ValidationError from "../domain/errors/validation-error";
import NotFoundError from "../domain/errors/not-found-error";
import B_Req from "../infrastructure/db/entities/B_Req";

const getallB_Reqs = async (
    req: Request,
    res: Response, 
    next: NextFunction
) => {
    try {
        const b_reqs = await B_Req.find().populate("b_profile").populate("req_evidence").populate("predictions").populate("gn_division_Id");
        res.status(200).json(b_reqs);
    } catch (error) {
        next(error);
    }
}

const getB_ReqById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const b_req = await B_Req.findById(req.params.id).populate("b_profile").populate("req_evidence").populate("predictions").populate("gn_division_Id");
        if (!b_req) {
            throw new NotFoundError("Beneficiary Request not found");
        }
        res.status(200).json(b_req);
    } catch (error) {
        next(error);
    }
}

const createB_Req = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const newb_req = B_Reqdto.safeParse(req.body);
        if (!newb_req.success) {
            throw new ValidationError(newb_req.error.message);
        }
        const {b_profile,req_evidence,gn_division_Id} = newb_req.data;
        const createdB_Req = await B_Req.create({
            b_profile,
            req_evidence,
            gn_division_Id,
        });
        res.status(201).json(createdB_Req);
    } catch (error) {
        next(error);
    }
}

const updateB_Req = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const updatedb_req = await B_Req.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updatedb_req) {
            throw new NotFoundError("Beneficiary Request not found");
        }
        res.status(200).json(updatedb_req);
    } catch (error) {
        next(error);
    }
}

const deleteB_ReqbyId = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const deletedb_req = await B_Req.findByIdAndDelete(req.params.id);
        if (!deletedb_req) {
            throw new NotFoundError("Beneficiary Request not found");
        }
        res.status(200).json({ message: "Beneficiary Request deleted successfully" });
    } catch (error) {
        next(error);
    }
}

export {
    getallB_Reqs,
    getB_ReqById,
    createB_Req,
    updateB_Req,
    deleteB_ReqbyId
};

