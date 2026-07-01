import { prisma } from "@repo/db";
import { Hono } from "hono";
import { adminAuth } from "../lib/firebaseAdmin.js";
import { z } from "zod";

const syncUserSchema = z.object({
  name: z.string().trim().min(1).optional(),
});

export const usersRoute = new Hono().post("/me", async (c) => {
  // Firebase ID token 検証
  const authorization = c.req.header("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const idToken = authorization.replace("Bearer ", "");

  let decodedToken;

  try {
    decodedToken = await adminAuth.verifyIdToken(idToken);
  } catch {
    return c.json({ message: "Unauthorized" }, 401);
  }

  if (!decodedToken.email) {
    return c.json({ message: "Email is required" }, 400);
  }

  const body = await c.req.json();
  const parsedBody = syncUserSchema.safeParse(body);

  if (!parsedBody.success) {
    return c.json({ message: "Invalid request body" }, 400);
  }

  // prisma.user.upsert
  const user = await prisma.user.upsert({
    where: {
      firebaseUid: decodedToken.uid,
    },
    update: {
      name: parsedBody.data.name,
      email: decodedToken.email,
    },
    create: {
      firebaseUid: decodedToken.uid,
      name: parsedBody.data.name,
      email: decodedToken.email,
    },
  });

  return c.json({
    id: user.id,
    firebaseUid: user.firebaseUid,
    name: user.name,
    email: user.email,
  });
});
