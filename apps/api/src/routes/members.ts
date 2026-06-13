import { prisma } from "@repo/db";
import { Hono } from "hono";
import type { MemberResponse } from "../schemas/members.js";

export const membersRoute = new Hono().get("/", async (c) => {
  const members = await prisma.member.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      gender: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      plan: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const response: MemberResponse[] = members.map((member) => ({
    id: member.id,
    name: member.name,
    email: member.email,
    phone: member.phone,
    gender: member.gender,
    status: member.status,
    plan: {
      id: member.plan.id,
      name: member.plan.name,
    },
    createdAt: member.createdAt.toISOString(),
    updatedAt: member.updatedAt.toISOString(),
  }));

  return c.json(response);
});

export type MemberRouteType = typeof membersRoute;
