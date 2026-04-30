import {z} from 'zod';

const News_postdto =z.object({
  author_name: z.string().min(1, "Author name is required"),
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  content: z.string().min(10, "Content is required").max(5000, "Content is too long"),
  image_url: z.string().url("Invalid URL format").optional(),
  category: z.enum(["general", "project_updates", "volunteer_spotlight", "success_stories", "urgent_needs","awareness_campaigns",
          "press_releases"], "Invalid category"),
});

export default News_postdto;