import { render, screen, waitFor } from '@testing-library/react';
import { MatchingPreviewModal } from '../MatchingPreviewModal';
import { useMatchingPreview } from '@/lib/hooks/useMatchingPreview';
import { useAuth } from '@/lib/hooks/useAuth';

// Mock the hooks
jest.mock('@/lib/hooks/useMatchingPreview');
jest.mock('@/lib/hooks/useAuth');

const mockUseMatchingPreview = useMatchingPreview as jest.MockedFunction<typeof useMatchingPreview>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('MatchingPreviewModal', () => {
  beforeEach(() => {
    mockUseMatchingPreview.mockReturnValue({
      preview: null,
      history: [],
      queryDetails: null,
      loading: false,
      error: null,
      runPreview: jest.fn(),
      fetchHistory: jest.fn(),
      fetchQueryDetails: jest.fn(),
      clearPreview: jest.fn(),
      clearError: jest.fn(),
    });

    mockUseAuth.mockReturnValue({
      user: { companyId: 'test-company-id' },
      isAuthenticated: true,
    } as any);
  });

  it('renders the trigger button', () => {
    render(
      <MatchingPreviewModal>
        <button>Open Modal</button>
      </MatchingPreviewModal>
    );

    expect(screen.getByText('Open Modal')).toBeInTheDocument();
  });

  it('shows loading state when loading', () => {
    mockUseMatchingPreview.mockReturnValue({
      preview: null,
      history: [],
      queryDetails: null,
      loading: true,
      error: null,
      runPreview: jest.fn(),
      fetchHistory: jest.fn(),
      fetchQueryDetails: jest.fn(),
      clearPreview: jest.fn(),
      clearError: jest.fn(),
    });

    render(
      <MatchingPreviewModal>
        <button>Open Modal</button>
      </MatchingPreviewModal>
    );

    // Note: This is a basic test structure. In a real test, you'd need to:
    // 1. Click the trigger button to open the modal
    // 2. Check for loading indicators
    // 3. Test the actual modal content
  });

  it('handles preview results correctly', async () => {
    const mockPreview = {
      queryId: 'test-query-id',
      totalMatches: 2,
      averageScore: 0.75,
      bestMatchScore: 0.95,
      results: [
        {
          companyId: 'company-1',
          companyName: 'Test Company 1',
          matchScore: 0.95,
          location: 'Berlin',
          specializations: ['Elektrotechnik'],
          certifications: ['ISO 9001'],
          verifications: ['registered'],
        },
        {
          companyId: 'company-2',
          companyName: 'Test Company 2',
          matchScore: 0.55,
          location: 'Munich',
          specializations: ['Maschinenbau'],
          certifications: [],
          verifications: ['insured'],
        },
      ],
      createdAt: new Date(),
    };

    mockUseMatchingPreview.mockReturnValue({
      preview: mockPreview,
      history: [],
      queryDetails: null,
      loading: false,
      error: null,
      runPreview: jest.fn(),
      fetchHistory: jest.fn(),
      fetchQueryDetails: jest.fn(),
      clearPreview: jest.fn(),
      clearError: jest.fn(),
    });

    render(
      <MatchingPreviewModal>
        <button>Open Modal</button>
      </MatchingPreviewModal>
    );

    // Note: This is a basic test structure. In a real test, you'd need to:
    // 1. Click the trigger button to open the modal
    // 2. Navigate to the results tab
    // 3. Check that the companies are displayed correctly
    // 4. Verify the match scores are formatted correctly
  });

  it('displays error messages', () => {
    mockUseMatchingPreview.mockReturnValue({
      preview: null,
      history: [],
      queryDetails: null,
      loading: false,
      error: 'Test error message',
      runPreview: jest.fn(),
      fetchHistory: jest.fn(),
      fetchQueryDetails: jest.fn(),
      clearPreview: jest.fn(),
      clearError: jest.fn(),
    });

    render(
      <MatchingPreviewModal>
        <button>Open Modal</button>
      </MatchingPreviewModal>
    );

    // Note: This is a basic test structure. In a real test, you'd need to:
    // 1. Click the trigger button to open the modal
    // 2. Check that the error message is displayed
    // 3. Verify the error styling is correct
  });
}); 