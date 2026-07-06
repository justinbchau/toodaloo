// Canonical rate-limit copy — keep the exact string in sync with any test
// that asserts it (Confirmation.test.tsx currently asserts this verbatim).
export const RATE_LIMIT_MESSAGE =
  "You're requesting codes too quickly. Please wait a bit and try again.";

// Map a Supabase auth error to a user-facing string. Structural param type so
// callers don't need to import AuthError. Rate-limit (HTTP 429 or the
// over_*_rate_limit codes) gets friendly copy; everything else passes the raw
// message through (fallback to a generic line if absent).
export function friendlyAuthError(
  error: { status?: number; code?: string; message?: string } | null | undefined
): string {
  if (!error) return 'Something went wrong. Please try again.';
  if (error.status === 429
      || error.code === 'over_email_send_rate_limit'
      || error.code === 'over_request_rate_limit') {
    return RATE_LIMIT_MESSAGE;
  }
  return error.message ?? 'Something went wrong. Please try again.';
}
