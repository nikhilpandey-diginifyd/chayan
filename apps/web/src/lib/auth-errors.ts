type AuthError = { code?: string; message?: string; status?: number } | null | undefined;

const messages: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "That email and password don't match. Check both and try again.",
  EMAIL_NOT_VERIFIED: "Confirm your email first. We've sent you a new link.",
  USER_ALREADY_EXISTS: "An account with this email already exists. Sign in instead.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    "An account with this email already exists. Sign in instead.",
  PASSWORD_TOO_SHORT: "Use at least 8 characters for your password.",
  PASSWORD_TOO_LONG: "Use 128 characters or fewer for your password.",
  INVALID_EMAIL: "Enter a valid email address.",
  INVALID_TOKEN: "This link has expired or was already used. Request a new one.",
};

export function authErrorMessage(error: AuthError): string {
  if (!error) return "Something went wrong. Try again.";
  if (error.status === 429) return "Too many attempts. Wait a few minutes and try again.";
  if (error.code && messages[error.code]) return messages[error.code]!;
  return error.message || "Something went wrong. Try again.";
}
