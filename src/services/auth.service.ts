import * as usersRepo from "@/lib/repositories/users";
import bcrypt from "bcryptjs";

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role?: string;
}) {
  const hashedPassword = await bcrypt.hash(data.password, 12);
  return usersRepo.createUser({
    name: data.name,
    email: data.email,
    hashedPassword,
    role: data.role || "reader",
  });
}

export async function getUserById(id: string) {
  return usersRepo.getUser(id);
}

export async function getUsers() {
  return usersRepo.getUsers();
}
