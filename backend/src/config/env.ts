import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(8),
  CLIENT_URL: z.string().url().default("http://localhost:3000")
});

export const env = envSchema.parse(process.env);
