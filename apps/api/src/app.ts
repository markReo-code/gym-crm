import { Hono } from "hono";
import { loggerMiddleware } from "./middleware/logger.js";
import { membersRoute } from "./routes/members.js";
import { corsMiddleware } from "./middleware/cors.js";
import { requestIdMiddleware } from "./middleware/requestId.js";

//  実際に起動する Hono app
export const app = new Hono()
  .use("*", requestIdMiddleware)
  .use("*", loggerMiddleware)
  .use("*", corsMiddleware)

  .route("/members", membersRoute);

// そのappの型
export type AppType = typeof app;
