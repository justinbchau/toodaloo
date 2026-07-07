/**
 * Tests for ReportSheet — the reason-picker used to report a bathroom or review.
 * Covers the insert payload, the confirmation, the not-signed-in guard, the
 * error path, and duplicate-report (unique violation) treated as success.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import ReportSheet from '../../components/ReportSheet';

// jest.mock factories are hoisted; only names matching /^mock/ may be referenced.
const mockInsert = jest.fn();
let mockUserValue: any = { id: 'test-user-id-123', email: 'test@example.com' };
const mockOnClose = jest.fn();

jest.mock('../../context/ThemeContext', () => ({
  useThemeContext: () => ({
    colors: {
      bg: '#0B0B0F', surface1: '#111118', surface2: '#18181F', surface3: '#1E1E28',
      text1: '#EEEEF4', text2: '#8B8B9E', text3: '#44444F',
      purple: '#7B6EF6', purpleDim: 'rgba(123,110,246,0.16)', purpleText: '#A99FF9',
      border: '#1E1E28', borderMed: '#2A2A35', green: '#34C77A', red: '#F05A5A', yellow: '#F5C542',
    },
    isDark: false,
  }),
}));

jest.mock('../../context/UserContext', () => ({
  useUser: () => ({ user: mockUserValue }),
}));

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: () => ({ insert: (...args: any[]) => mockInsert(...args) }),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockUserValue = { id: 'test-user-id-123', email: 'test@example.com' };
  mockInsert.mockResolvedValue({ error: null });
});

const bathroomTarget = { type: 'bathroom' as const, id: 'bathroom-1' };
const reviewTarget = { type: 'review' as const, id: 'review-1' };

describe('ReportSheet — reason picker', () => {
  it('renders the reason options when opened with a target', () => {
    render(<ReportSheet target={bathroomTarget} onClose={mockOnClose} />);
    expect(screen.getByText('Report this listing')).toBeTruthy();
    expect(screen.getByText('Inappropriate or offensive')).toBeTruthy();
    expect(screen.getByText('Spam or fake')).toBeTruthy();
    expect(screen.getByText('Other')).toBeTruthy();
  });

  it('renders nothing interactive when target is null (sheet closed)', () => {
    render(<ReportSheet target={null} onClose={mockOnClose} />);
    expect(screen.queryByText('Report this listing')).toBeNull();
  });

  it('says "review" in the title when reporting a review', () => {
    render(<ReportSheet target={reviewTarget} onClose={mockOnClose} />);
    expect(screen.getByText('Report this review')).toBeTruthy();
  });
});

describe('ReportSheet — submission', () => {
  it('inserts the correct payload for a bathroom and confirms', async () => {
    render(<ReportSheet target={bathroomTarget} onClose={mockOnClose} />);

    await act(async () => {
      fireEvent.press(screen.getByText('Spam or fake'));
    });

    expect(mockInsert).toHaveBeenCalledWith({
      reporter_id: 'test-user-id-123',
      target_type: 'bathroom',
      target_id: 'bathroom-1',
      reason: 'Spam or fake',
    });
    await waitFor(() => expect(screen.getByText("Thanks — we'll take a look")).toBeTruthy());
  });

  it('inserts a review target_type when reporting a review', async () => {
    render(<ReportSheet target={reviewTarget} onClose={mockOnClose} />);

    await act(async () => {
      fireEvent.press(screen.getByText('Safety concern'));
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ target_type: 'review', target_id: 'review-1' }),
    );
  });

  it('treats a duplicate report (unique violation) as success', async () => {
    mockInsert.mockResolvedValue({ error: { code: '23505', message: 'duplicate key' } });
    render(<ReportSheet target={bathroomTarget} onClose={mockOnClose} />);

    await act(async () => {
      fireEvent.press(screen.getByText('Other'));
    });

    await waitFor(() => expect(screen.getByText("Thanks — we'll take a look")).toBeTruthy());
    expect(screen.queryByText("Couldn't submit your report. Try again.")).toBeNull();
  });

  it('shows an inline error and no confirmation when the insert fails', async () => {
    mockInsert.mockResolvedValue({ error: { code: '42501', message: 'permission denied' } });
    render(<ReportSheet target={bathroomTarget} onClose={mockOnClose} />);

    await act(async () => {
      fireEvent.press(screen.getByText('Inappropriate or offensive'));
    });

    await waitFor(() => expect(screen.getByText("Couldn't submit your report. Try again.")).toBeTruthy());
    expect(screen.queryByText("Thanks — we'll take a look")).toBeNull();
  });
});

describe('ReportSheet — auth guard', () => {
  it('shows a sign-in prompt and no reasons when signed out', () => {
    mockUserValue = null;
    render(<ReportSheet target={bathroomTarget} onClose={mockOnClose} />);

    expect(screen.getByText('Sign in to report')).toBeTruthy();
    expect(screen.queryByText('Spam or fake')).toBeNull();
  });

  it('does not attempt an insert when signed out', () => {
    mockUserValue = null;
    render(<ReportSheet target={bathroomTarget} onClose={mockOnClose} />);
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
