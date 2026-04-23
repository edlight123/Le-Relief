import "dotenv/config";
import * as usersRepo from "@/lib/repositories/users";

async function main() {
  const email = process.argv[2];
  const role = process.argv[3] ?? "admin";

  if (!email) {
    console.error("Usage: tsx scripts/set-user-role.ts <email> [role]");
    process.exit(1);
  }

  const user = await usersRepo.findByEmail(email);

  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(2);
  }

  await usersRepo.updateUser(user.id as string, { role });
  const updated = await usersRepo.findByEmail(email);
  console.log(JSON.stringify(updated, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(99);
});
