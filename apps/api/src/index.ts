import "dotenv/config";
import { serve } from "@hono/node-server";
import { app } from "./app.js";

serve({
  fetch: app.fetch,
  port: 8080,
});

console.log("API running on 8080");
