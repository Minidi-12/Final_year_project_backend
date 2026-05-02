import {z} from 'zod';
import mongoose from "mongoose";

const objectId = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId",
  });

const Volunteerdto = z.object({
  project_id: z.string().min(1, "Project ID is required"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  Phone_no: z.string().regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits"),
  skills: z.array(z.string().min(1, "Skill cannot be empty")).default([]),
  availability: z.enum(["weekdays", "weekends", "flexible"],"Invalid availability option").optional(),
  message: z.string().optional(),
  matchScore: z.number().min(0).max(100).optional(),
  recommendedProjects: z.array(
      z.object({
        project_id: objectId,
        matchScore: z.number().min(0).max(100),
        matchedSkills: z.array(z.string()),
      })
    )
    .optional(),
});

export const VolunteerMatchPreviewDto = z.object({
  skills: z.array(z.string().min(1, "Skill cannot be empty"))
    .min(1, "At least one skill is required")
});

export const RunMatchingDto = z.object({
  volunteer_id: z.string().optional() 
});

export default Volunteerdto;