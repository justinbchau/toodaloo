/**
 * Tests for the Zod validation schemas used in auth screens.
 * Schemas are inlined here because they aren't exported from the page files —
 * we test the validation rules directly without rendering any components.
 *
 * Auth is email OTP: Login and SignUp both collect only an email address,
 * and Confirmation collects the 6-digit code.
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Login schema (matches pages/Login.tsx)
// ---------------------------------------------------------------------------
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

describe('Login schema', () => {
  it('accepts a valid email', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailError = result.error.issues.find(i => i.path[0] === 'email');
      expect(emailError?.message).toBe('Please enter a valid email');
    }
  });

  it('rejects an empty email', () => {
    const result = loginSchema.safeParse({ email: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing email field', () => {
    const result = loginSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects an email without a domain', () => {
    const result = loginSchema.safeParse({ email: 'user@' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// SignUp schema (matches pages/SignUp.tsx — identical email-only OTP flow)
// ---------------------------------------------------------------------------
const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

describe('SignUp schema', () => {
  it('accepts a valid email', () => {
    const result = signUpSchema.safeParse({ email: 'new-user@example.com' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = signUpSchema.safeParse({ email: 'nope' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Please enter a valid email');
    }
  });

  it('rejects an empty email', () => {
    const result = signUpSchema.safeParse({ email: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing email field', () => {
    const result = signUpSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Confirmation schema (matches pages/Confirmation.tsx)
// ---------------------------------------------------------------------------
const confirmationSchema = z.object({
  code: z.string().min(1, 'Code is required'),
});

describe('Confirmation schema', () => {
  it('accepts a 6-digit OTP code', () => {
    const result = confirmationSchema.safeParse({ code: '123456' });
    expect(result.success).toBe(true);
  });

  it('accepts a single character (schema has no format restriction)', () => {
    const result = confirmationSchema.safeParse({ code: '1' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty code', () => {
    const result = confirmationSchema.safeParse({ code: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Code is required');
    }
  });

  it('rejects missing code field', () => {
    const result = confirmationSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
