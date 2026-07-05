/**
 * Tests for WriteReview — star picker state machine, submit guard,
 * character counter, Supabase insert on new reviews, and the edit flow
 * that prefills + updates an existing review.
 */
import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { WriteReview } from '../../pages/WriteReview';
import { mockColors, mockUser } from '../helpers/mocks';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockGoBack = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack, navigate: mockNavigate }),
  useRoute: () => ({ params: { bathroomId: 'bath-1', bathroomName: 'Test Bathroom' } }),
}));

jest.mock('../../context/ThemeContext', () => ({
  useThemeContext: () => ({ colors: mockColors, isDark: false }),
}));

jest.mock('../../context/UserContext', () => ({
  useUser: () => ({ user: mockUser, session: null, loading: false, signOut: jest.fn() }),
}));

const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockUpdateEq = jest.fn();
const mockMaybeSingle = jest.fn();

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      // Existing-review lookup: .select().eq().eq().maybeSingle()
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: (...args: any[]) => mockMaybeSingle(...args),
          })),
        })),
      })),
      insert: (...args: any[]) => mockInsert(...args),
      // Update: .update(payload).eq('id', ...)
      update: (...args: any[]) => {
        mockUpdate(...args);
        return { eq: (...eqArgs: any[]) => mockUpdateEq(...eqArgs) };
      },
    })),
  },
}));

const existingReview = { id: 'review-1', rating: 3, body: 'Decent spot.' };

beforeEach(() => {
  jest.clearAllMocks();
  // Default: user has not reviewed this bathroom yet.
  mockMaybeSingle.mockResolvedValue({ data: null, error: null });
  mockInsert.mockResolvedValue({ error: null });
  mockUpdateEq.mockResolvedValue({ error: null });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function renderWriteReview() {
  const result = render(<WriteReview />);
  // Wait for the existing-review lookup to finish (spinner → form).
  await waitFor(() => expect(screen.getByText('Test Bathroom')).toBeTruthy());
  return result;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('WriteReview — initial render', () => {
  it('renders the bathroom name from route params', async () => {
    await renderWriteReview();
    expect(screen.getByText('Test Bathroom')).toBeTruthy();
  });

  it('renders 5 empty stars initially', async () => {
    await renderWriteReview();
    const stars = screen.getAllByText('☆');
    expect(stars).toHaveLength(5);
  });

  it('renders the character counter at 0/280', async () => {
    await renderWriteReview();
    expect(screen.getByText('0/280')).toBeTruthy();
  });

  it('renders the submit button label', async () => {
    await renderWriteReview();
    expect(screen.getByText('Submit Review')).toBeTruthy();
  });

  it('renders the "Write a Review" header for a new review', async () => {
    await renderWriteReview();
    expect(screen.getByText('Write a Review')).toBeTruthy();
  });
});

describe('WriteReview — submit button disabled state', () => {
  it('submit button is disabled when no star is selected (rating=0)', async () => {
    await renderWriteReview();
    // @testing-library/jest-native's toBeDisabled checks if the element
    // or any ancestor has disabled=true / accessibilityState.disabled=true
    expect(screen.getByText('Submit Review')).toBeDisabled();
  });

  it('submit button becomes enabled after selecting a star', async () => {
    await renderWriteReview();
    const emptyStars = screen.getAllByText('☆');
    fireEvent.press(emptyStars[2]); // tap star 3
    expect(screen.getByText('Submit Review')).not.toBeDisabled();
  });

  it('submit button is disabled while submitting', async () => {
    let resolveInsert!: (val: any) => void;
    mockInsert.mockReturnValueOnce(
      new Promise((res) => { resolveInsert = res; }),
    );

    await renderWriteReview();
    const emptyStars = screen.getAllByText('☆');
    fireEvent.press(emptyStars[0]);

    act(() => {
      fireEvent.press(screen.getByText('Submit Review'));
    });

    // While pending: label changes and button is disabled
    expect(screen.getByText('Submitting...')).toBeDisabled();

    await act(async () => { resolveInsert({ error: null }); });
  });
});

describe('WriteReview — star picker interactions', () => {
  it('fills stars 1-3 and leaves 4-5 empty when star 3 is tapped', async () => {
    await renderWriteReview();
    const emptyStars = screen.getAllByText('☆');
    fireEvent.press(emptyStars[2]); // tap star index 2 = star 3

    expect(screen.getAllByText('★')).toHaveLength(3);
    expect(screen.getAllByText('☆')).toHaveLength(2);
  });

  it('fills all 5 stars when star 5 is tapped', async () => {
    await renderWriteReview();
    const emptyStars = screen.getAllByText('☆');
    fireEvent.press(emptyStars[4]); // tap star 5

    expect(screen.getAllByText('★')).toHaveLength(5);
    expect(screen.queryByText('☆')).toBeNull();
  });

  it('fills only star 1 when star 1 is tapped', async () => {
    await renderWriteReview();
    const emptyStars = screen.getAllByText('☆');
    fireEvent.press(emptyStars[0]); // tap star 1

    expect(screen.getAllByText('★')).toHaveLength(1);
    expect(screen.getAllByText('☆')).toHaveLength(4);
  });

  it('reduces filled stars when a lower star is pressed after a higher one', async () => {
    await renderWriteReview();

    // Tap star 5 → all 5 filled
    const allEmpty = screen.getAllByText('☆');
    fireEvent.press(allEmpty[4]);
    expect(screen.getAllByText('★')).toHaveLength(5);

    // Tap star 2 (index 1 in the filled stars row)
    const allFilled = screen.getAllByText('★');
    fireEvent.press(allFilled[1]); // tap the 2nd ★

    expect(screen.getAllByText('★')).toHaveLength(2);
    expect(screen.getAllByText('☆')).toHaveLength(3);
  });

  it('each star tap overrides the previous rating', async () => {
    await renderWriteReview();

    const s1 = screen.getAllByText('☆');
    fireEvent.press(s1[0]); // tap star 1 → rating = 1; now ★ ☆ ☆ ☆ ☆
    expect(screen.getAllByText('★')).toHaveLength(1);

    // After star 1 is filled, getAllByText('☆') returns [star2, star3, star4, star5]
    // index 2 = star 4 (0-indexed: star2=0, star3=1, star4=2, star5=3)
    const s2 = screen.getAllByText('☆');
    fireEvent.press(s2[2]); // tap star 4 → rating = 4
    expect(screen.getAllByText('★')).toHaveLength(4);
  });
});

describe('WriteReview — character counter', () => {
  it('updates counter as text is typed', async () => {
    await renderWriteReview();
    const textInput = screen.getByPlaceholderText('Share your experience...');
    fireEvent.changeText(textInput, 'Great bathroom!');
    expect(screen.getByText('15/280')).toBeTruthy();
  });

  it('resets to 0/280 when text is cleared', async () => {
    await renderWriteReview();
    const textInput = screen.getByPlaceholderText('Share your experience...');
    fireEvent.changeText(textInput, 'Hello');
    fireEvent.changeText(textInput, '');
    expect(screen.getByText('0/280')).toBeTruthy();
  });

  it('shows correct count for multi-character text', async () => {
    await renderWriteReview();
    const textInput = screen.getByPlaceholderText('Share your experience...');
    fireEvent.changeText(textInput, 'A'.repeat(100));
    expect(screen.getByText('100/280')).toBeTruthy();
  });
});

describe('WriteReview — Supabase submission (new review)', () => {
  it('calls supabase.from("reviews").insert() with correct data', async () => {
    await renderWriteReview();

    const emptyStars = screen.getAllByText('☆');
    fireEvent.press(emptyStars[3]); // star 4

    const textInput = screen.getByPlaceholderText('Share your experience...');
    fireEvent.changeText(textInput, 'Very clean!');

    await act(async () => {
      fireEvent.press(screen.getByText('Submit Review'));
    });

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith({
        bathroom_id: 'bath-1',
        user_id: mockUser.id,
        rating: 4,
        body: 'Very clean!',
      });
    });
  });

  it('sends body: null when body is empty after trimming', async () => {
    await renderWriteReview();

    const emptyStars = screen.getAllByText('☆');
    fireEvent.press(emptyStars[0]); // star 1 — body stays empty

    await act(async () => {
      fireEvent.press(screen.getByText('Submit Review'));
    });

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ body: null }),
      );
    });
  });

  it('trims whitespace-only body to null', async () => {
    await renderWriteReview();

    const emptyStars = screen.getAllByText('☆');
    fireEvent.press(emptyStars[0]);

    const textInput = screen.getByPlaceholderText('Share your experience...');
    fireEvent.changeText(textInput, '   ');

    await act(async () => {
      fireEvent.press(screen.getByText('Submit Review'));
    });

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ body: null }),
      );
    });
  });

  it('calls navigation.goBack() on successful submit', async () => {
    await renderWriteReview();
    const emptyStars = screen.getAllByText('☆');
    fireEvent.press(emptyStars[0]);

    await act(async () => {
      fireEvent.press(screen.getByText('Submit Review'));
    });

    await waitFor(() => expect(mockGoBack).toHaveBeenCalledTimes(1));
  });

  it('does NOT call goBack() when insert returns an error', async () => {
    mockInsert.mockResolvedValueOnce({ error: { message: 'DB error' } });

    await renderWriteReview();
    const emptyStars = screen.getAllByText('☆');
    fireEvent.press(emptyStars[0]);

    await act(async () => {
      fireEvent.press(screen.getByText('Submit Review'));
    });

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled();
      expect(mockGoBack).not.toHaveBeenCalled();
    });
  });

  it('shows an "Already reviewed" alert on a unique-violation (23505) error', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    mockInsert.mockResolvedValueOnce({ error: { code: '23505', message: 'duplicate key' } });

    await renderWriteReview();
    const emptyStars = screen.getAllByText('☆');
    fireEvent.press(emptyStars[0]);

    await act(async () => {
      fireEvent.press(screen.getByText('Submit Review'));
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Already reviewed', expect.any(String));
      expect(mockGoBack).not.toHaveBeenCalled();
    });
    alertSpy.mockRestore();
  });

  it('does NOT submit when rating is 0 (guard clause)', async () => {
    await renderWriteReview();
    // Do NOT tap any star — button is disabled so submit never fires

    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe('WriteReview — edit flow (existing review)', () => {
  beforeEach(() => {
    mockMaybeSingle.mockResolvedValue({ data: existingReview, error: null });
  });

  it('prefills the star rating and body from the existing review', async () => {
    await renderWriteReview();

    expect(screen.getAllByText('★')).toHaveLength(3);
    expect(screen.getAllByText('☆')).toHaveLength(2);
    expect(screen.getByDisplayValue('Decent spot.')).toBeTruthy();
  });

  it('shows the edit header and "Update Review" button label', async () => {
    await renderWriteReview();

    expect(screen.getByText('Edit Your Review')).toBeTruthy();
    expect(screen.getByText('Update Review')).toBeTruthy();
  });

  it('treats the legacy "(no comment)" body as empty', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { ...existingReview, body: '(no comment)' },
      error: null,
    });

    await renderWriteReview();

    expect(screen.getByText('0/280')).toBeTruthy();
    expect(screen.queryByDisplayValue('(no comment)')).toBeNull();
  });

  it('calls update (not insert) with the new values and goes back', async () => {
    await renderWriteReview();

    // Bump rating from 3 to 5: after prefill ☆ = [star4, star5]
    const emptyStars = screen.getAllByText('☆');
    fireEvent.press(emptyStars[1]); // star 5

    const textInput = screen.getByDisplayValue('Decent spot.');
    fireEvent.changeText(textInput, 'Actually great!');

    await act(async () => {
      fireEvent.press(screen.getByText('Update Review'));
    });

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({ rating: 5, body: 'Actually great!' });
      expect(mockUpdateEq).toHaveBeenCalledWith('id', 'review-1');
      expect(mockInsert).not.toHaveBeenCalled();
      expect(mockGoBack).toHaveBeenCalledTimes(1);
    });
  });

  it('does NOT go back when the update fails', async () => {
    mockUpdateEq.mockResolvedValueOnce({ error: { message: 'DB error' } });

    await renderWriteReview();

    await act(async () => {
      fireEvent.press(screen.getByText('Update Review'));
    });

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockGoBack).not.toHaveBeenCalled();
    });
  });
});
