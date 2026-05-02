import {z} from 'zod';

const Projectdto = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.enum(["health", "education", "environment", "community_development", "disaster_relief", "infrastructure", "other"],"Invalid category"),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000, "Description too long"),
  status: z.enum(["active", "completed", "on_hold"]).default("active"),
  location: z.string().min(1, "Location is required"),
  requiredSkills: z.array(z.string().min(1, "Skill cannot be empty")).optional().default([]),
  budget: z.number().min(0, "Budget must be a positive number"),
  fundsRaised: z.number().min(0, "Funds raised must be a positive number").default(0),
  volunteers_needed: z.number().min(0, "Volunteers needed must be a positive number").default(0),
  start_date: z.coerce.date(),
  end_date: z.coerce.date().optional(),
  skillsEmbedding: z.array(z.number()).optional().default([]),
  skillsText: z.string().optional().default(""),
})

.refine((data) => {
  // end date must be after start date if provided
  if (data.end_date && data.start_date) {
    return new Date(data.end_date) > new Date(data.start_date);
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["end_date"],
});

const updateProjectStatusDTO = z.object({
  status: z.enum(["active", "completed", "on_hold"], "Invalid status")
});


export { Projectdto, updateProjectStatusDTO };