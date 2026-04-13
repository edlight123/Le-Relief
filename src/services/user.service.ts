import { db } from "@/lib/db";

export async function updateUserRole(userId: string, role: string) {
  return db.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  });
}

export async function updateUserProfile(
  userId: string,
  data: { name?: string }
) {
  return db.user.update({
    where: { id: userId },
    data,
    select: { id: true, name: true, email: true, role: true },
  });
}
