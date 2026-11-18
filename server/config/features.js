// Feature flags of the server. They come from the environment, never from the client.
//
// SRV_STU_PET_META · flag key `enable_student_list_pet_metadata`
// Env variable: ENABLE_STUDENT_LIST_PET_METADATA ("true", "1", "on" or "yes" turns it on).
// Default: OFF, so deploying the code changes nothing until the variable is set.
export const SRV_STU_PET_META = "SRV_STU_PET_META";
export const STUDENT_LIST_PET_METADATA_FLAG = "enable_student_list_pet_metadata";

const TRUE_VALUES = new Set(["1", "true", "on", "yes"]);

// Read on every call (not at import time) so a test or a redeploy can change it.
export function isStudentListPetMetadataEnabled(env = process.env) {
  const raw = String(env.ENABLE_STUDENT_LIST_PET_METADATA ?? "").trim().toLowerCase();
  return TRUE_VALUES.has(raw);
}
