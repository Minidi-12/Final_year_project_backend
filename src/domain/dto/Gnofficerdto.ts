import { z } from "zod";
import mongoose from "mongoose";

const objectId = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId",
  });

export const createGnofficerSchema = z.object({
  name: z.string().min(1, "Officer name is required"),
  phone_no: z
    .string()
    .regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits"),
  gn_division_id: objectId,
  user_id: objectId.optional(),
  proofFileUrl: z.string().url("Invalid file URL").optional(),
  proofFileName: z.string().optional(),
});

export const updateGnofficerSchema = z.object({
  name: z.string().min(1, "Officer name is required").optional(),
  phone_no: z
    .string()
    .regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits")
    .optional(),
  gn_division_id: objectId.optional(),
  user_id: objectId.optional(),
  proofFileUrl: z.string().url("Invalid file URL").optional(),
  proofFileName: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CreateGnofficerDTO = z.infer<typeof createGnofficerSchema>;
export type UpdateGnofficerDTO = z.infer<typeof updateGnofficerSchema>;
