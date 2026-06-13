import { z } from "zod";

export const memberResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  phone: z.string().nullable(),
  gender: z.string(),
  status: z.enum(["active", "inactive", "suspended"]),
  plan: z.object({
    id: z.string(),
    name: z.string(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type MemberResponse = z.infer<typeof memberResponseSchema>;
