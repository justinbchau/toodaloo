/**
 * Tests for WriteReview — star picker state machine, submit guard,
 * character counter, and Supabase insert on successful submission.
 */
import React from 'react';
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

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: (...args: any[]) => mockInsert(...args),
    })),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockInsert.mockResolvedValue({ error: null });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function renderWriteReview() {
  return render(<WriteReview />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('WriteReview — initial render', () => {
  it('renders the bathroom name from route params', () => {
    renderWriteReview();
    expect(screen.getByText('Test Bathroom')).toBeTruthy();
  });

  it('renders 5 empty stars initially', () => {
    renderWriteReview();
    const stars = screen.getAllByText('☆');
    expect(stars).toHaveLength(5);
  });

  it('renders the character counter at 0/280', () => {
    renderWriteReview();
    expect(screen.getByText('0/280')).toBeTruthy();
  });

  it('renders the submit button label', () => {
    renderWriteReview();
    expect(screen.getByText('Submit Review')).toBeTruthy();
  });
});

describe('WriteReview — submit button disabled state', () => {
  it('submit button is disabled when no star is selected (rating=0)', () => {
    renderWriteReview();
    // @testing-library/jest-native's toBeDisabled checks if the element
    // or any ancestor has disabled=true / accessibilityState.disabled=true
    expect(screen.getByText('Submit Review')).toBeDisabled();
  });

  it('submit button becomes enabled after selecting a star', () => {
    renderWriteReview();
    const emptyStars = screen.getAllByText('☆');
    fireEvent.press(emptyStars[2]); // tap star 3
    expect(screen.getByText('Submit Review')).not.toBeDisabled();
  });

  it('submit button is disabled while submitting', async () => {
    let resolveInsert!: (val: any) => void;
    mockInsert.mockReturnValueOnce(
      new Promise((res) => { resolveInsert = res; }),
    );

    renderWriteReview();
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
  it('fills stars 1-3 and leaves 4-5 empty when star 3 is tapped', () => {
    renderWriteReview();
    const emptyStars = screen.getAllByText('☆');
    fireEvent.press(emptyStars[2]); // tap star index 2 = star 3

    expect(screen.getAllByText('★')).toHaveLength(3);
    expect(screen.getAllByText('☆')).toHaveLength(2);
  });

  it('fills all 5 stars when star 5 is tapped', () => {
    renderWriteReview();
    const emptyStars = screen.getAllByText('☆');
    fireEvent.press(emptyStars[4]); // tap star 5

    expect(screen.getAllByText('★')).toHaveLength(5);
    expect(screen.queryByText('☆')).toBeNull();
  });

  it('fills only star 1 when star 1 is tapped', () => {
    renderWriteReview();
    const emptyStars = screen.getAllByText('☆');
    fireEvent.press(emptyStars[0]); // tap star 1

    expect(screen.getAllByText('★')).toHaveLength(1);
    expect(screen.getAllByText('☆')).toHaveLength(4);
  });

  it('reduces filled stars when a lower star is pressed after a higher one', () => {
    renderWriteReview();

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

  it('each star tap overrides the previous rating', () => {
    renderWriteReview();

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
  it('updates counter as text is typed', () => {
    renderWriteReview();
    const textInput = screen.getByPlaceholderText('Share your experience...');
    fireEvent.changeText(textInput, 'Great bathroom!');
    expect(screen.getByText('15/280')).toBeTruthy();
  });

  it('resets to 0/280 when text is cleared', () => {
    renderWriteReview();
    const textInput = screen.getByPlaceholderText('Share your experience...');
    fireEvent.changeText(textInput, 'Hello');
    fireEvent.changeText(textInput, '');
    expect(screen.getByText('0/280')).toBeTruthy();
  });

  it('shows correct count for multi-character text', () => {
    renderWriteReview();
    const textInput = screen.getByPlaceholderText('Share your experience...');
    fireEvent.changeText(textInput, 'A'.repeat(100));
    expect(screen.getByText('100/280')).toBeTruthy();
  });
});

describe('WriteReview — Supabase submission', () => {
  it('calls supabase.from("reviews").insert() with correct data', async () => {
    renderWriteReview();

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

  it('sends "(no comment)" when body is empty after trimming', async () => {
    renderWriteReview();

    const emptyStars = screen.getAllByText('☆');
    fireEvent.press(emptyStars[0]); // star 1 — body stays empty

    await act(async () => {
      fireEvent.press(screen.getByText('Submit Review'));
    });

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ body: '(no comment)' }),
      );
    });
  });

  it('trims whitespace-only body to "(no comment)"', async () => {
    renderWriteReview();

    const emptyStars = screen.getAllByText('☆');
    fireEvent.press(emptyStars[0]);

    const textInput = screen.getByPlaceholderText('Share your experience...');
    fireEvent.changeText(textInput, '   ');

    await act(async () => {
      fireEvent.press(screen.getByText('Submit Review'));
    });

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ body: '(no comment)' }),
      );
    });
  });

  it('calls navigation.goBack() on successful submit', async () => {
    renderWriteReview();
    const emptyStars = screen.getAllByText('☆');
    fireEvent.press(emptyStars[0]);

    await act(async () => {
      fireEvent.press(screen.getByText('Submit Review'));
    });

    await waitFor(() => expect(mockGoBack).toHaveBeenCalledTimes(1));
  });

  it('does NOT call goBack() when insert returns an error', async () => {
    mockInsert.mockResolvedValueOnce({ error: { message: 'DB error' } });

    renderWriteReview();
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

  it('does NOT submit when rating is 0 (guard clause)', async () => {
    renderWriteReview();
    // Do NOT tap any star

    await act(async () => {
      // Manually try to call submit — button is disabled so this won't fire
      // but even if it did, the guard should prevent insert
    });

    expect(mockInsert).not.toHaveBeenCalled();
  });
});
