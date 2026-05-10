# Company Components

This directory contains React components related to company functionality, particularly for displaying company ratings and reviews.

## CompanyRatingsSection

The `CompanyRatingsSection` component displays comprehensive company ratings and reviews on company profile pages.

### Features

- **Overall Rating Display**: Shows the company's average rating with star visualization
- **Category Breakdown**: Displays detailed ratings for 8 different categories (Communication, Response Time, Punctuality, etc.)
- **Recent Projects**: Lists recent completed projects with ratings and company role indicators
- **Loading States**: Skeleton loaders while data is being fetched
- **Error Handling**: User-friendly error messages with retry functionality
- **Empty States**: Appropriate messaging when no reviews are available
- **Responsive Design**: Works well on desktop and mobile devices
- **Internationalization**: Supports German and English translations

### Props

```typescript
interface CompanyRatingsSectionProps {
  /** The unique identifier of the company */
  companyId: string;
  /** Optional callback when a project is clicked for navigation */
  onProjectClick?: (orderId: string) => void;
  /** Optional className for styling */
  className?: string;
}
```

### Usage

```tsx
import { CompanyRatingsSection } from '@/components/company'

// Basic usage
<CompanyRatingsSection companyId="company-123" />

// With project click handler
<CompanyRatingsSection
  companyId="company-123"
  onProjectClick={(orderId) => router.push(`/reviews/order/${orderId}`)}
/>

// With custom styling
<CompanyRatingsSection
  companyId="company-123"
  className="bg-gray-50 p-6 rounded-lg"
/>
```

### Requirements Covered

This component fulfills the following requirements from the specification:

- **1.1**: Display overall average rating and category averages prominently
- **1.2**: Show total reviews count and completed orders statistics
- **1.3**: Display recent projects list with ratings and company role indicators
- **1.4**: Handle loading states, error states, and empty states appropriately

### Data Flow

1. Component receives `companyId` prop
2. Uses `companyRatingsApiService.getCompanyRatingsSummary()` to fetch data
3. Displays loading skeleton while fetching
4. On success: renders ratings summary, category breakdown, and recent projects
5. On error: shows error message with retry button
6. On empty data: shows appropriate empty state message

### Error Handling

The component handles various error scenarios:

- **Invalid Company ID**: Shows validation error
- **Company Not Found**: Shows 404-style error
- **Network Errors**: Shows network error with retry option
- **Access Denied**: Shows permission error
- **Rate Limiting**: Shows rate limit exceeded message
- **Server Errors**: Shows generic server error

### Styling

The component uses:

- **Tailwind CSS** for styling
- **Radix UI components** for consistent design system
- **Lucide React icons** for visual elements
- **Custom color schemes** for different rating levels
- **Responsive grid layouts** for different screen sizes

### Testing

The component includes comprehensive tests covering:

- Loading states
- Success states with data rendering
- Error states and retry functionality
- Empty states
- Project click interactions
- Data formatting and display

### Dependencies

- `@/lib/api/company-ratings`: API service for fetching ratings data
- `@/lib/types/company-ratings`: TypeScript interfaces
- `@/components/ui/*`: UI components (Card, Badge, Progress, etc.)
- `next-intl`: Internationalization
- `lucide-react`: Icons

### Performance Considerations

- **API Caching**: The underlying API service includes caching to reduce redundant requests
- **Lazy Loading**: Only loads data when component mounts
- **Skeleton Loading**: Provides immediate visual feedback while loading
- **Error Boundaries**: Prevents crashes from propagating up the component tree

### Accessibility

- **Semantic HTML**: Uses proper heading hierarchy and semantic elements
- **ARIA Labels**: Includes appropriate ARIA labels for screen readers
- **Keyboard Navigation**: Supports keyboard navigation for interactive elements
- **Color Contrast**: Ensures sufficient color contrast for readability
- **Focus Management**: Proper focus management for interactive elements

### Future Enhancements

Potential improvements for future versions:

- **Pagination**: Add pagination for large numbers of recent projects
- **Filtering**: Allow filtering by rating range or date
- **Sorting**: Enable sorting by different criteria
- **Export**: Add ability to export ratings data
- **Comparison**: Compare ratings with industry averages
- **Trends**: Show rating trends over time