import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type AuditActor = {
  type: "ADMIN" | "MAHASISWA" | "SYSTEM";
  id?: string | null;
  label?: string | null;
};

export async function recordAudit(input: {
  action: string;
  feedbackId: string;
  actor: AuditActor;
  details?: Prisma.InputJsonValue;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        entityId: input.feedbackId,
        actorType: input.actor.type,
        actorId: input.actor.id ?? null,
        actorLabel: input.actor.label ?? null,
        details: input.details,
      },
    });
  } catch (error) {
    console.error("AUDIT LOG ERROR:", error);
  }
}