import {z} from 'zod';

const Volunteerdto = z.object({
  project_id: z.string().min(1, "Project ID is required"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  Phone_no: z.string().regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits"),
  skills: z.array(z.string().min(1, "Skill cannot be empty")).default([]),
  availability: z.enum(["weekdays", "weekends", "flexible"],"Invalid availability option").optional(),
  message: z.string().optional(),
});

export default Volunteerdto;