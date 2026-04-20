import { Request, Response,NextFunction } from "express";
import { Projectdto } from "../domain/dto/Projectdto";
import ValidationError from "../domain/errors/validation-error";
import NotFoundError from "../domain/errors/not-found-error";
import Project from "../infrastructure/db/entities/Project";
import { z } from "zod";

const getallProjects = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const projects = await Project.find();
        res.status(200).json(projects);
    } catch (error) {
        next(error);
    }
};

const getProjectById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            throw new NotFoundError("Project not found");
        }
        res.status(200).json(project);
    } catch (error) {
        next(error);
    }
};

const createProject = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const projectData = Projectdto.parse(req.body);
        const project = await Project.create(projectData);
        res.status(201).json(project);
    } catch (error) {
        if (error instanceof ValidationError) {
            res.status(400).json({ error: error.message });
        } else {
            next(error);
        }
    }
};

const updateProjectStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const updateProjectStatusDTO = z.object({ status: z.enum(["active", "completed", "on_hold"]) }).parse(req.body);
        const { status } = updateProjectStatusDTO;
        const project = await Project.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!project) {
            throw new NotFoundError("Project not found");
        }
        res.status(200).json(project);
    } catch (error) {
        if (error instanceof ValidationError) {
            res.status(400).json({ error: error.message });
        } else {
            next(error);
        }
    }
};

const deleteProjectById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);
        if (!project) {
            throw new NotFoundError("Project not found");
        }
        res.status(200).json({ message: "Project deleted successfully" });
    } catch (error) {
        next(error);
    }
};

export { 
    getallProjects, 
    getProjectById, 
    createProject, 
    updateProjectStatus, 
    deleteProjectById 
};

