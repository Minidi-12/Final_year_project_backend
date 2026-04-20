import {z} from 'zod';

const Donationdto = z.object({
  project_id: z.string().min(1, "Project ID is required"),
  name: z.string().min(1, "Name is required"),
  nic: z.string().min(1, "NIC is required").regex(/^([0-9]{9}[vVxX]|[0-9]{12})$/,
       "Invalid Sri Lanka NIC — must be 9 digits + V/X or 12 digits"),
  email: z.string().email("Invalid email address").optional().nullable(),
  phone_no: z.string().optional().nullable(),
  amount: z.number().positive("Amount must be a positive number"),
  currency: z.enum(["LKR", "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "SEK"]).default("LKR"),
  type: z.enum(["one-time", "recurring", "in-kind","sponsorship","crowd-funding"], "Invalid donation type"),
  status: z.enum(["pending", "confirmed", "failed"]).optional(),
  message: z.string().max(500, "Message is too long").optional(),
  });

export default Donationdto;