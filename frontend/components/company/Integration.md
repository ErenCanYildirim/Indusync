# CompanyRatingsSection Integration Guide

This guide explains how to integrate the `CompanyRatingsSection` component into existing company profile pages.

## Quick Start

1. **Import the component:**

```tsx
import { CompanyRatingsSection } from "@/components/company";
```

2. **Add to your company profile page:**

```tsx
export default function CompanyProfilePage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="container mx-auto py-8">
      <h1>Company Profile</h1>

      {/* Add the ratings section */}
      <CompanyRatingsSection
        companyId={params.id}
        onProjectClick={(orderId) => {
          // Navigate to detailed review page (implement in task 9)
          router.push(`/reviews/order/${orderId}`);
        }}
      />
    </div>
  );
}
```

## Integration with Existing Profile Layout

If you have an existing company profile layout, you can integrate the ratings section like this:

```tsx
export default function CompanyProfilePage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Existing header */}
      <CompanyHeader companyId={params.id} />

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Existing sidebar */}
          <div className="lg:col-span-1">
            <CompanyInfoSidebar companyId={params.id} />
          </div>

          {/* Main content with ratings */}
          <div className="lg:col-span-3 space-y-8">
            {/* Existing company description */}
            <CompanyDescription companyId={params.id} />

            {/* NEW: Add ratings section */}
            <CompanyRatingsSection
              companyId={params.id}
              onProjectClick={(orderId) => {
                router.push(`/reviews/order/${orderId}`);
              }}
            />

            {/* Existing other sections */}
            <CompanyServices companyId={params.id} />
            <CompanyTeam companyId={params.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Error Handling

The component handles errors internally, but you can also wrap it in an error boundary:

```tsx
import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div className="text-center py-8">
      <h2>Something went wrong with the ratings section</h2>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

export default function CompanyProfilePage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <CompanyRatingsSection companyId={params.id} />
      </ErrorBoundary>
    </div>
  );
}
```

## Styling Customization

You can customize the appearance by passing a className:

```tsx
<CompanyRatingsSection
  companyId={params.id}
  className="bg-gray-50 p-6 rounded-xl shadow-lg"
/>
```

## Performance Optimization

The component includes built-in caching, but you can also prefetch data:

```tsx
import { companyRatingsApiService } from "@/lib/api/company-ratings";

export default function CompanyProfilePage({
  params,
}: {
  params: { id: string };
}) {
  // Prefetch ratings data
  useEffect(() => {
    companyRatingsApiService.prefetchCompanyRatings(params.id);
  }, [params.id]);

  return (
    <div>
      <CompanyRatingsSection companyId={params.id} />
    </div>
  );
}
```

## Next Steps

After implementing this component, you'll want to:

1. **Task 8**: Implement the `PastProjectsList` component for paginated project reviews
2. **Task 9**: Create the `DetailedReviewPage` component for comprehensive review display
3. **Task 11**: Set up routing for detailed review pages

## Testing Integration

To test the integration:

1. **Unit Tests**: The component includes comprehensive unit tests
2. **Integration Tests**: Test the complete flow from profile page to ratings display
3. **E2E Tests**: Test user interactions and navigation

Example integration test:

```tsx
import { render, screen } from "@testing-library/react";
import CompanyProfilePage from "./CompanyProfilePage";

test("company profile displays ratings section", async () => {
  render(<CompanyProfilePage params={{ id: "test-company" }} />);

  await waitFor(() => {
    expect(screen.getByText("Bewertungen & Rezensionen")).toBeInTheDocument();
  });
});
```

## Troubleshooting

**Common Issues:**

1. **Component not loading**: Check that the company ID is valid
2. **API errors**: Verify the backend endpoints are working
3. **Styling issues**: Ensure Tailwind CSS is properly configured
4. **Translation errors**: Check that next-intl is set up correctly

**Debug Mode:**

```tsx
// Enable debug logging
console.log('Loading ratings for company:', companyId)

<CompanyRatingsSection
  companyId={companyId}
  onProjectClick={(orderId) => {
    console.log('Project clicked:', orderId)
    router.push(`/reviews/order/${orderId}`)
  }}
/>
```