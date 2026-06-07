import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hono !!");
});

serve({
  fetch: app.fetch,
  port: 8080,
});

console.log("API running on 8080");
