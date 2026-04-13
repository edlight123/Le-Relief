import * as usersRepo from "@/lib/repositories/users";

export async function updateUserRole(userId: string, role: string) {
  return usersRepo.updateUser(userId, { role });
}

export async function updateUserProfile(
  userId: string,
  data: { name?: string }
) {
  return usersRepo.updateUser(userId, data);
}
