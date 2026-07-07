import { prisma } from "@/lib/prisma";

export async function createNotification(
  companyId: string,
  type: string,
  title: string,
  message?: string,
  link?: string
) {
  try {
    await prisma.notification.create({
      data: { companyId, type, title, message, link },
    });
  } catch {
    // Silently fail - notifications are non-critical
  }
}
