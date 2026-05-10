/**
 * Focus Management Utilities for Dashboard Components
 * 
 * Provides utilities for managing focus states, keyboard navigation,
 * and accessibility enhancements in dashboard components.
 */

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
        'button:not([disabled])',
        '[href]',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]',
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
}

/**
 * Trap focus within a container (useful for modals, dropdowns)
 */
export function trapFocus(container: HTMLElement, event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;

    const focusableElements = getFocusableElements(container);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
        // Shift + Tab: moving backwards
        if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
        }
    } else {
        // Tab: moving forwards
        if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
        }
    }
}

/**
 * Move focus to the next/previous focusable element
 */
export function moveFocus(
    container: HTMLElement,
    direction: 'next' | 'previous' | 'first' | 'last'
): boolean {
    const focusableElements = getFocusableElements(container);
    if (focusableElements.length === 0) return false;

    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

    let targetIndex: number;
    switch (direction) {
        case 'first':
            targetIndex = 0;
            break;
        case 'last':
            targetIndex = focusableElements.length - 1;
            break;
        case 'next':
            targetIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
            break;
        case 'previous':
            targetIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
            break;
        default:
            return false;
    }

    focusableElements[targetIndex]?.focus();
    return true;
}

/**
 * Enhanced keyboard navigation handler for dashboard items
 */
export function handleDashboardItemKeyNavigation(
    event: KeyboardEvent,
    container: HTMLElement,
    onActivate?: () => void
): void {
    switch (event.key) {
        case 'Enter':
        case ' ':
            event.preventDefault();
            onActivate?.();
            break;

        case 'ArrowDown':
        case 'ArrowRight':
            event.preventDefault();
            moveFocus(container, 'next');
            break;

        case 'ArrowUp':
        case 'ArrowLeft':
            event.preventDefault();
            moveFocus(container, 'previous');
            break;

        case 'Home':
            event.preventDefault();
            moveFocus(container, 'first');
            break;

        case 'End':
            event.preventDefault();
            moveFocus(container, 'last');
            break;

        case 'Escape':
            // Allow parent components to handle escape
            break;
    }
}

/**
 * Announce content changes to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

/**
 * Restore focus to a previously focused element with fallback
 */
export function restoreFocus(
    previousElement: HTMLElement | null,
    fallbackSelector?: string
): void {
    try {
        if (previousElement && document.contains(previousElement)) {
            previousElement.focus();
            return;
        }
    } catch (error) {
        console.warn('Could not restore focus to previous element:', error);
    }

    // Fallback to selector or first focusable element
    if (fallbackSelector) {
        const fallbackElement = document.querySelector(fallbackSelector) as HTMLElement;
        if (fallbackElement) {
            fallbackElement.focus();
            return;
        }
    }

    // Final fallback to first focusable element
    const firstFocusable = getFocusableElements(document.body)[0];
    firstFocusable?.focus();
}

/**
 * Create a focus trap for a container element
 */
export function createFocusTrap(container: HTMLElement): {
    activate: () => void;
    deactivate: () => void;
} {
    let isActive = false;
    let previouslyFocusedElement: HTMLElement | null = null;

    const handleKeyDown = (event: KeyboardEvent) => {
        if (!isActive) return;
        trapFocus(container, event);
    };

    const activate = () => {
        if (isActive) return;

        previouslyFocusedElement = document.activeElement as HTMLElement;
        isActive = true;

        document.addEventListener('keydown', handleKeyDown);

        // Focus first element in container
        const firstFocusable = getFocusableElements(container)[0];
        firstFocusable?.focus();
    };

    const deactivate = () => {
        if (!isActive) return;

        isActive = false;
        document.removeEventListener('keydown', handleKeyDown);

        // Restore focus
        restoreFocus(previouslyFocusedElement);
        previouslyFocusedElement = null;
    };

    return { activate, deactivate };
}