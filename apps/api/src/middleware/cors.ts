import { cors } from "hono/cors";

const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000";

export const corsMiddleware = cors({
  origin: corsOrigin,
});
