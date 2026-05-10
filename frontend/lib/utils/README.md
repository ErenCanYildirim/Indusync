# Dynamic Content Translation

This module provides utilities for translating dynamic content from the backend, specifically role-specific metric descriptions and tooltips that may come from the server in a specific language and need to be translated to the user's selected language.

## Overview

The dashboard receives dynamic content from the backend through the `roleContext` field in the `DashboardStatistics` response. This content includes role-specific descriptions and tooltips for metrics that vary based on whether the user is a client, provider, or has dual roles.

## Features

- **Role-aware Translation**: Provides different translations based on user roles (client, provider, dual)
- **Language Detection**: Automatically detects German content and translates it appropriately
- **Fallback Strategy**: Multiple levels of fallback to ensure content is always displayed
- **Future-proof**: Handles cases where backend might provide localized content in the future

## Usage

### Basic Usage

```typescript
import { useDynamicContentTranslation } from "@/lib/utils/dynamic-content-translation";

const { translateRoleContextContent } = useDynamicContentTranslation();

// Translate all dynamic content from backend
const translatedContent = translateRoleContextContent(
  statistics.roleContext, // Backend role context data
  statistics.roleContext // Role context for determining appropriate translations
);

// Use translated content
<DashboardMetricCard
  description={translatedContent.activeOrdersDescription}
  tooltip={translatedContent.activeOrdersTooltip}
/>;
```

### Individual Content Translation

```typescript
const { translateDynamicContent } = useDynamicContentTranslation();

const translatedDescription = translateDynamicContent(
  backendDescription, // Content from backend
  "activeOrders", // Metric type
  "description", // Content type
  roleContext // Role context
);
```

## Translation Keys Structure

The translation keys are organized hierarchically in the message files:

```json
{
  "Dashboard": {
    "dynamicContent": {
      "activeOrders": {
        "description": {
          "client": "Client-specific description",
          "provider": "Provider-specific description",
          "dual": "Dual-role description",
          "default": "Default description"
        },
        "tooltip": {
          "client": "Client-specific tooltip",
          "provider": "Provider-specific tooltip",
          "dual": "Dual-role tooltip",
          "default": "Default tooltip"
        }
      }
    }
  }
}
```

**Note**: The translation keys in the utility are relative to the Dashboard namespace since `useTranslations('Dashboard')` provides the context.

## Supported Metrics

- **activeOrders**: Active orders metric
- **openApplications**: Open applications metric
- **completedOrders**: Completed orders metric
- **responseTime**: Average response time metric

## Role Context

The system supports three role types:

- **Client**: User acts as a client (creates orders)
- **Provider**: User acts as a service provider (fulfills orders)
- **Dual**: User acts in both roles

## Fallback Strategy

The translation system uses a multi-level fallback strategy:

1. **Role-specific translation**: Uses client/provider/dual specific translation
2. **Default translation**: Falls back to default metric translation
3. **Backend content**: Uses original backend content if no translations exist
4. **Empty string**: Ultimate fallback if all else fails

## Language Detection

The system includes a simple heuristic to detect German content by looking for common German words and patterns:

- Übersicht, Aufträge, Bewerbungen
- abgeschlossen, durchschnittlich
- Antwortzeit, laufend, eingegangen
- And more...

## Implementation Details

### Hook: `useDynamicContentTranslation`

Returns an object with translation functions:

- `translateDynamicContent(content, metricType, contentType, roleContext)`: Translates individual content
- `translateRoleContextContent(roleContextContent, roleContext)`: Translates all role context content

### Utility Functions

- `needsTranslation(content)`: Type guard to check if content needs translation
- `isGermanContent(content)`: Detects if content is in German

## Testing

The module includes comprehensive tests covering:

- Language detection functionality
- Translation key structure validation
- Role-specific translation logic
- Fallback behavior

Run tests with:

```bash
npm test -- dynamic-content-translation
```

## Examples

See `examples/dynamic-content-translation-example.tsx` for comprehensive usage examples showing:

- Client role translation
- Provider role translation
- Dual role translation
- English content pass-through
- Individual content translation

## Future Enhancements

- More sophisticated language detection
- Support for additional languages
- Backend language indicators
- Caching of translated content
- Performance optimizations

## Integration with Dashboard

The dynamic content translation is integrated into the dashboard page (`app/[lang]/dashboard/page.tsx`) where it:

1. Receives dynamic content from the `useDashboardStatistics` hook
2. Translates the content based on the user's role context
3. Provides translated content to `DashboardMetricCard` components
4. Falls back to static translations when dynamic content is not available

This ensures that metric descriptions and tooltips are always displayed in the user's selected language, regardless of the language used by the backend.