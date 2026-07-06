/**
 * Tests for friendlyAuthError — the shared auth error-formatting path used by
 * Login, SignUp, and Confirmation. Page-level suites only exercise the 429
 * branch; this covers all four so a regression here can't slip through.
 */
import { friendlyAuthError, RATE_LIMIT_MESSAGE } from '../../lib/authErrors';

describe('friendlyAuthError', () => {
  it('maps an HTTP 429 status to the rate-limit message', () => {
    expect(friendlyAuthError({ status: 429, message: 'Too many requests' })).toBe(
      RATE_LIMIT_MESSAGE
    );
  });

  it('maps the over_email_send_rate_limit code to the rate-limit message', () => {
    expect(friendlyAuthError({ code: 'over_email_send_rate_limit' })).toBe(RATE_LIMIT_MESSAGE);
  });

  it('maps the over_request_rate_limit code to the rate-limit message', () => {
    expect(friendlyAuthError({ code: 'over_request_rate_limit' })).toBe(RATE_LIMIT_MESSAGE);
  });

  it('passes through a non-rate-limit error message unchanged', () => {
    expect(friendlyAuthError({ status: 400, message: 'Token has expired' })).toBe(
      'Token has expired'
    );
  });

  it('falls back to a generic message for a null or undefined error', () => {
    expect(friendlyAuthError(null)).toMatch(/something went wrong/i);
    expect(friendlyAuthError(undefined)).toMatch(/something went wrong/i);
  });

  it('falls back to a generic message when there is no message and no rate-limit signal', () => {
    expect(friendlyAuthError({ status: 500 })).toMatch(/something went wrong/i);
  });
});
