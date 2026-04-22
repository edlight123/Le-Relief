import { normalizeAppRole, type AppRole } from "@/lib/role-routing";

export const E2E_ROLE_HEADER = "x-test-role";
export const E2E_REQUEST_ROLE_HEADER = "x-e2e-role";
export const E2E_REQUEST_USER_ID_HEADER = "x-e2e-user-id";

export function isE2ETestModeEnabled() {
  return process.env.E2E_TEST_MODE === "1";
}

export function resolveE2ERole(value: string | null | undefined): AppRole | null {
  if (!isE2ETestModeEnabled()) return null;
  return normalizeAppRole(value);
}
