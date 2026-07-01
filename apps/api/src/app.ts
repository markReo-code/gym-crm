import { Hono } from "hono";
import { loggerMiddleware } from "./middleware/logger.js";
import { membersRoute } from "./routes/members.js";
import { corsMiddleware } from "./middleware/cors.js";
import { requestIdMiddleware } from "./middleware/requestId.js";
import { prisma } from "@repo/db";
import { usersRoute } from "./routes/users.js";

//  実際に起動する Hono app
export const app = new Hono()
  .use("*", requestIdMiddleware)
  .use("*", loggerMiddleware)
  .use("*", corsMiddleware)

  .get("/health", (c) => {
    return c.json({ status: "ok" });
  })

  .get("/health/db", async (c) => {
    try {
      await prisma.$queryRaw`SELECT 1`;

      return c.json({
        status: "ok",
        database: "connected",
      });
    } catch (error) {
      console.log(error);

      return c.json(
        {
          status: "error",
          database: "disconnected",
        },
        500,
      );
    }
  })

  .route("/users", usersRoute)
  .route("/members", membersRoute);

// そのappの型
export type AppType = typeof app;
