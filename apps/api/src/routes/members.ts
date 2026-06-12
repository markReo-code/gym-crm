import { prisma } from "@repo/db";
import { Hono } from "hono";
import type { MemberResponse } from "../schemas/members.js";

export const membersRoute = new Hono().get("/", async (c) => {
  const members = await prisma.member.findMany();

  const response: MemberResponse[] = members.map((member) => ({
    id: member.id,
    name: member.name,
    email: member.email,
    phone: member.phone,
    gender: member.gender,
    status: member.status,
    planId: member.planId,
    createdAt: member.createdAt.toISOString(),
    updatedAt: member.updatedAt.toISOString(),
  }));

  return c.json(response);
});

export type MemberRouteType = typeof membersRoute;
