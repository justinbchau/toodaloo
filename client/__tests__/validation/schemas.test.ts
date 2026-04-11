/**
 * Tests for the Zod validation schemas used in auth screens.
 * Schemas are inlined here because they aren't exported from the page files —
 * we test the validation rules directly without rendering any components.
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Login schema (matches pages/Login.tsx)
// ---------------------------------------------------------------------------
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

describe('Login schema', () => {
  it('accepts a valid email + password', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: 'secret' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'secret' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailError = result.error.issues.find(i => i.path[0] === 'email');
      expect(emailError?.message).toBe('Please enter a valid email');
    }
  });

  it('rejects an empty email', () => {
    const result = loginSchema.safeParse({ email: '', password: 'secret' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty password', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const pwError = result.error.issues.find(i => i.path[0] === 'password');
      expect(pwError?.message).toBe('Password is required');
    }
  });

  it('rejects missing fields', () => {
    const result = loginSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('accepts a single-character password', () => {
    const result = loginSchema.safeParse({ email: 'a@b.co', password: 'x' });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// SignUp schema (matches pages/SignUp.tsx)
// ---------------------------------------------------------------------------
const signUpSchema = z.object({
  phone: z.string().min(1, 'Phone number is required'),
});

describe('SignUp schema', () => {
  it('accepts any non-empty phone string', () => {
    const result = signUpSchema.safeParse({ phone: '+15551234567' });
    expect(result.success).toBe(true);
  });

  it('accepts a bare number string', () => {
    const result = signUpSchema.safeParse({ phone: '5551234567' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty phone string', () => {
    const result = signUpSchema.safeParse({ phone: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Phone number is required');
    }
  });

  it('rejects missing phone field', () => {
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
