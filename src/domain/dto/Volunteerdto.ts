import {z} from 'zod';

const Volunteerdto = z.object({
  project_id: z.string().min(1, "Project ID is required"),
  user_id: z.string().optional(),
  nic: z.string().min(1, "NIC is required").regex(/^([0-9]{9}[vVxX]|[0-9]{12})$/,"Invalid format for NIC"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format").optional(),
  skills: z.array(z.string().min(1, "Skill cannot be empty")).default([]),
  availability: z.enum(["weekdays", "weekends", "flexible"],"Invalid availability option").optional(),
  district: z.string().optional(),
});

export default Volunteerdto;