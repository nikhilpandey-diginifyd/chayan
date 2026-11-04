import { z } from "zod";

export const USER_ROLES = ["aspirant", "mentor", "admin"] as const;
export const userRoleSchema = z.enum(USER_ROLES);
export type UserRole = z.infer<typeof userRoleSchema>;

export const PREP_LANGUAGES = ["hindi", "english", "hinglish"] as const;
export const prepLanguageSchema = z.enum(PREP_LANGUAGES);
export type PrepLanguage = z.infer<typeof prepLanguageSchema>;

export const PREP_LANGUAGE_LABELS: Record<PrepLanguage, string> = {
  hindi: "Hindi",
  english: "English",
  hinglish: "Hinglish",
};

export const MAX_ATTEMPT_NUMBER = 10;
