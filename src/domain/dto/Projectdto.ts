import {z} from 'zod';

const Projectdto = z.object({
  created_by: z.string().min(1, "Created by is required"),
  title: z.string().min(1, "Title is required"),
  category: z.enum(["health", "education", "environment", "community_development", "disaster_relief", "other"],"Invalid category"),
  subCategory: z.enum(["eye_clinic","dental_clinic", "general_clinic","blood_donation","maternal_health","child_health","elderly_care",
    "disability_support","scholarship","tuition_support","school_supplies","digital_literacy","sanitary_access","clean_water",
    "waste_management","housing_support","counselling","legal_aid","youth_development","community_awareness","elder_companionship",
    "women_empowerment","disaster_relief","pre-loved_clothing_distribution","emergency_food","food_assistance","tech_project",
    "microfinance","agriculture_support","entrepreneurship"],"Invalid subcategory"),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000, "Description too long"),
  status: z.enum(["active", "completed", "on_hold"]).default("active"),
  location: z.string().min(1, "Location is required"),
  budget: z.number().min(0, "Budget must be a positive number"),
  fundsRaised: z.number().min(0, "Funds raised must be a positive number").default(0),
  volunteers_needed: z.number().min(0, "Volunteers needed must be a positive number").default(0),
  start_date: z.date(),
  end_date: z.date().optional(),
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