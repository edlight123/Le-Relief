import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role?: string;
}) {
  const hashedPassword = await bcrypt.hash(data.password, 12);
  return db.user.create({
    data: {
      name: data.name,
      email: data.email,
      hashedPassword,
      role: data.role || "reader",
    },
  });
}

export async function getUserById(id: string) {
  return db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      createdAt: true,
    },
  });
}

export async function getUsers() {
  return db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
