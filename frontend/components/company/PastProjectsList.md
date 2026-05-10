# PastProjectsList Component

## Overview

The `PastProjectsList` component displays a paginated list of completed projects with ratings for a company. It shows project details including name, completion date, overall rating, and company role (client/provider), with click handlers for navigation to detailed review pages.

## Features

- **Paginated Display**: Shows completed projects with pagination controls
- **Project Details**: Displays project name, completion date, overall rating, and company role
- **Interactive Navigation**: Click handlers for navigating to detailed review pages
- **Loading States**: Skeleton loaders while data is being fetched
- **Error Handling**: Error states with retry functionality
- **Empty States**: Appropriate messaging when no projects exist
- **Responsive Design**: Works on desktop and mobile devices

## Requirements Covered

- **2.1**: Display list of completed projects with individual ratings
- **2.2**: Show project name, completion date, overall rating, company role, and status
- **2.5**: Handle empty states when no completed projects exist

## Props

```typescript
interface PastProjectsListProps {
  /** The unique identifier of the company */
  companyId: string;
  /** Callback when a project is clicked for navigation to detailed review page */
  onProjectClick: (orderId: string) => void;
  /** Number of items per page */
  pageSize?: number;
  /** Optional className for styling */
  className?: string;
}
```

## Usage

### Basic Usage

```tsx
import { PastProjectsList } from "@/components/company";
import { useRouter } from "next/navigation";

export const CompanyProfilePage = ({ companyId }: { companyId: string }) => {
  const router = useRouter();

  const handleProjectClick = (orderId: string) => {
    router.push(`/reviews/order/${orderId}`);
  };

  return (
    <div>
      <PastProjectsList
        companyId={companyId}
        onProjectClick={handleProjectClick}
      />
    </div>
  );
};
```

### With Custom Page Size

```tsx
<PastProjectsList
  companyId={companyId}
  onProjectClick={handleProjectClick}
  pageSize={5}
  className="custom-styling"
/>
```

## Component Structure

### Main Features

1. **Project List Display**

   - Shows project name with hover effects
   - Displays company role badges (Auftraggeber/Dienstleister)
   - Shows completion date and reviewer company
   - Displays star ratings with quality level text

2. **Pagination Controls**

   - Previous/Next buttons
   - Page number buttons
   - Results count display
   - Automatic hiding when only one page

3. **State Management**
   - Loading states with skeleton UI
   - Error states with retry functionality
   - Empty states with helpful messaging

### Project Item Details

Each project item displays:

- **Project Name**: Clickable title that triggers navigation
- **Company Role**: Badge showing CLIENT (Auftraggeber) or PROVIDER (Dienstleister)
- **Status**: Current project status badge
- **Completion Date**: Formatted date in German locale
- **Reviewer**: Company that provided the review
- **Rating**: Star rating with numerical score and quality level

### Pagination Features

- **Smart Page Display**: Shows up to 5 page numbers around current page
- **Navigation Controls**: Previous/Next buttons with proper disabled states
- **Results Info**: Shows current range and total count
- **Responsive Design**: Adapts to different screen sizes

## Error Handling

The component handles various error scenarios:

- **Invalid Company ID**: Shows validation error
- **Company Not Found**: User-friendly 404 message
- **Network Errors**: Connection issue messaging
- **Access Denied**: Permission error handling
- **Rate Limiting**: Too many requests messaging
- **Server Errors**: Generic server error handling

## Loading States

- **Initial Load**: Full skeleton with project item placeholders
- **Pagination**: Maintains content while loading new pages
- **Retry**: Loading state during retry attempts

## Empty States

- **No Projects**: Helpful message explaining why no projects are shown
- **Clear Guidance**: Information about when projects will appear

## Styling

The component uses:

- **Tailwind CSS**: For responsive design and styling
- **shadcn/ui Components**: Card, Badge, Button, Skeleton components
- **Lucide Icons**: For visual elements and navigation
- **Hover Effects**: Interactive feedback for clickable elements

## API Integration

The component integrates with:

- **CompanyRatingsApiService**: For fetching paginated project data
- **Caching**: Automatic caching of API responses
- **Error Handling**: Comprehensive error transformation and handling

## Accessibility

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Focus Management**: Clear focus indicators
- **Color Contrast**: Meets WCAG guidelines

## Testing

The component includes comprehensive tests for:

- **Rendering**: Proper display of project data
- **Interaction**: Click handlers and navigation
- **Pagination**: Page navigation and controls
- **Error States**: Error handling and retry functionality
- **Loading States**: Skeleton display and transitions
- **Empty States**: No data scenarios

## Integration Notes

1. **Router Integration**: Requires proper navigation handler for project clicks
2. **API Configuration**: Needs configured API service for data fetching
3. **Internationalization**: Uses next-intl for German translations
4. **Theme Support**: Works with light/dark theme switching

## Performance Considerations

- **Pagination**: Limits data load for better performance
- **Caching**: API responses are cached to reduce requests
- **Lazy Loading**: Only loads data when component mounts
- **Optimized Rendering**: Efficient re-rendering on state changes

## Future Enhancements

Potential improvements could include:

- **Filtering**: Filter by company role or rating range
- **Sorting**: Sort by date, rating, or project name
- **Search**: Search within project names
- **Export**: Export project list to CSV/PDF
- **Bulk Actions**: Select multiple projects for actions