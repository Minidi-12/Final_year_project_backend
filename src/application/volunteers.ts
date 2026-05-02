// application/volunteers.ts
import { Request, Response, NextFunction } from "express";
import Volunteerdto, { VolunteerMatchPreviewDto, RunMatchingDto } from "../domain/dto/Volunteerdto";
import ValidationError from "../domain/errors/validation-error";
import NotFoundError from "../domain/errors/not-found-error";
import Volunteer from "../infrastructure/db/entities/volunteer";
import Project from "../infrastructure/db/entities/Project";
import { exec } from 'child_process';
import path from 'path';
import { ZodError } from "zod";

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
        
        // Check if project exists
        const project = await Project.findById(volunteerData.project_id);
        if (!project) {
            throw new NotFoundError("Project not found");
        }
        
        // Check if project is active
        if (project.status !== 'active') {
            return res.status(400).json({ 
                error: "This project is no longer accepting volunteers" 
            });
        }
        
        // Check for duplicate registration
        const existingVolunteer = await Volunteer.findOne({
            email: volunteerData.email,
            project_id: volunteerData.project_id
        });
        
        if (existingVolunteer) {
            return res.status(409).json({ 
                error: "You have already registered for this project" 
            });
        }
        
        // Create volunteer
        const volunteer = await Volunteer.create(volunteerData);
        
        // Run ML matching script in background
        const scriptPath = path.join(__dirname, '../../ml/volunteer_matching.py');
        exec(`python ${scriptPath}`, (error, stdout, stderr) => {
            if (error) {
                console.error('Matching script error:', stderr);
            } else {
                console.log('Matching completed:', stdout);
            }
        });
        
        res.status(201).json({
            message: "Volunteer registered successfully",
            volunteer: volunteer,
            note: "Project matches will be computed shortly"
        });
        
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({ 
                error: "Validation failed",
                details: error
            });
        } else if (error instanceof ValidationError) {
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
        const volunteerData = Volunteerdto.partial().parse(req.body);
        const volunteer = await Volunteer.findByIdAndUpdate(
            req.params.id, 
            volunteerData, 
            { new: true }
        );
        
        if (!volunteer) {
            throw new NotFoundError("Volunteer not found");
        }
        
        // Re-run matching if skills changed
        if (volunteerData.skills) {
            const scriptPath = path.join(__dirname, '../../ml/volunteer_matching.py');
            exec(`python ${scriptPath}`, (error) => {
                if (error) console.error('Re-matching error:', error);
            });
        }
        
        res.status(200).json(volunteer);
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({ 
                error: "Validation failed",
                details: error
            });
        } else if (error instanceof ValidationError) {
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

// NEW: Get volunteer with ML recommendations
const getVolunteerRecommendations = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const volunteer = await Volunteer.findById(req.params.id)
            .populate('project_id')
            .populate('recommendedProjects.project_id');
        
        if (!volunteer) {
            throw new NotFoundError("Volunteer not found");
        }
        
        res.status(200).json({
            volunteer: volunteer,
            recommendations: volunteer.recommendedProjects,
            matchScore: volunteer.matchScore
        });
    } catch (error) {
        next(error);
    }
};

// NEW: Preview matching projects for given skills (instant, no DB save)
const previewMatchingProjects = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { skills } = VolunteerMatchPreviewDto.parse(req.body);
        
        // Get all active projects
        const projects = await Project.find({ status: 'active' });
        
        if (projects.length === 0) {
            return res.status(200).json({ 
                message: "No active projects found",
                matches: [] 
            });
        }
        
        // Simple JavaScript matching (instant preview)
        const matches = projects.map(project => {
            const projectSkills = project.requiredSkills || [];
            
            // Find matched skills (case-insensitive partial match)
            const matchedSkills = skills.filter(skill => 
                projectSkills.some(ps => 
                    ps.toLowerCase().includes(skill.toLowerCase()) ||
                    skill.toLowerCase().includes(ps.toLowerCase())
                )
            );
            
            // Calculate match score (Jaccard similarity)
            const union = new Set([...skills, ...projectSkills]);
            const intersection = matchedSkills.length;
            const matchScore = Math.round((intersection / union.size) * 100);
            
            return {
                project: {
                    _id: project._id,
                    title: project.title,
                    description: project.description,
                    category: project.category,
                    location: project.location,
                    requiredSkills: projectSkills,
                    volunteersNeeded: project.volunteers_needed,
                },
                matchScore: matchScore,
                matchedSkills: matchedSkills,
                missingSkills: projectSkills.filter(ps => 
                    !matchedSkills.some(ms => 
                        ps.toLowerCase().includes(ms.toLowerCase()) ||
                        ms.toLowerCase().includes(ps.toLowerCase())
                    )
                )
            };
        })
        .filter(m => m.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 10); // Top 10 matches
        
        res.status(200).json({
            count: matches.length,
            matches: matches
        });
        
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({ 
                error: "Validation failed",
                details: error
            });
        } else if (error instanceof ValidationError) {
            res.status(400).json({ error: error.message });
        } else {
            next(error);
        }
    }
};

// NEW: Manually trigger ML matching script
const runMLMatching = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const scriptPath = path.join(__dirname, '../../ml/volunteer_matching.py');
        
        exec(`python ${scriptPath}`, (error, stdout, stderr) => {
            if (error) {
                console.error('ML Matching Error:', stderr);
                return res.status(500).json({ 
                    error: 'Matching failed',
                    details: stderr 
                });
            }
            
            res.status(200).json({ 
                message: 'ML matching completed successfully',
                output: stdout 
            });
        });
        
    } catch (error) {
        next(error);
    }
};

export { 
    getallVolunteers, 
    getVolunteerById, 
    createVolunteer, 
    updateVolunteer, 
    deleteVolunteerById,
    getVolunteerRecommendations,
    previewMatchingProjects,
    runMLMatching
};