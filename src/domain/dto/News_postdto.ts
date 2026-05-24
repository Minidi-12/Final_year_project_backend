import { z } from "zod";

const News_postdto = z.object({
  post_type: z.enum(["activity", "campaign", "upcoming"], {
    message: "post_type must be 'activity', 'campaign', or 'upcoming'",
  }),

  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(5000, "Description is too long"),
  image: z
    .string()
    .url("Invalid image URL")
    .optional()
    .or(z.literal(""))
    .nullable(),
  author_name: z.string().optional().default("Admin"),
  date: z.string().optional().default(""),
  location: z.string().optional().default(""),
  time: z.string().optional().default(""),
  capacity: z.string().optional().default(""),
  tag: z.string().optional().default(""),
  impact: z.string().optional().default(""),
});

export default News_postdto;
