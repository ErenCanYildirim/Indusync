"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

interface NavigationState {
    isNavigating: boolean;
    targetUrl?: string;
    returnContext?: {
        url: string;
        scrollPosition: number;
        timestamp: number;
    };
}

interface UseDashboardNavigationReturn {
    isNavigating: boolean;
    navigateToProject: (projectId: string) => Promise<void>;
    navigateToDeadline: (deadlineId: string, orderId: string, deadlineType?: string) => Promise<void>;
    navigateToOrdersList: () => Promise<void>;
    navigateToCalendar: () => Promise<void>;
    setReturnContext: () => void;
    getReturnUrl: () => string | null;
    handleFocusReturn: () => void;
}

/**
 * Enhanced navigation hook for dashboard components
 * 
 * Features:
 * - Loading indicators during navigation transitions
 * - Return context maintenance for proper back navigation
 * - Focus management for accessibility
 * - Scroll position preservation
 * - Navigation state tracking
 */
export function useDashboardNavigation(): UseDashboardNavigationReturn {
    const router = useRouter();
    const pathname = usePathname();
    const [navigationState, setNavigationState] = useState<NavigationState>({
        isNavigating: false,
    });

    // Refs for focus management
    const lastFocusedElementRef = useRef<HTMLElement | null>(null);
    const returnContextRef = useRef<NavigationState["returnContext"] | null>(null);

    // Store current focus element before navigation
    const storeFocusedElement = useCallback(() => {
        lastFocusedElementRef.current = document.activeElement as HTMLElement;
    }, []);

    // Set return context for proper back navigation
    const setReturnContext = useCallback(() => {
        returnContextRef.current = {
            url: pathname,
            scrollPosition: window.scrollY,
            timestamp: Date.now(),
        };
    }, [pathname]);

    // Get return URL if available
    const getReturnUrl = useCallback(() => {
        return returnContextRef.current?.url || null;
    }, []);

    // Handle focus return after navigation
    const handleFocusReturn = useCallback(() => {
        // Restore scroll position if returning from navigation
        if (returnContextRef.current) {
            const { scrollPosition, timestamp } = returnContextRef.current;

            // Only restore scroll if navigation was recent (within 5 minutes)
            if (Date.now() - timestamp < 5 * 60 * 1000) {
                setTimeout(() => {
                    window.scrollTo({ top: scrollPosition, behavior: "smooth" });
                }, 100);
            }
        }

        // Restore focus to previously focused element
        if (lastFocusedElementRef.current) {
            try {
                lastFocusedElementRef.current.focus();
            } catch (error) {
                // Element might no longer exist, focus on first focusable element
                const firstFocusable = document.querySelector(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                ) as HTMLElement;
                firstFocusable?.focus();
            }
        }
    }, []);

    // Enhanced navigation with loading state and context preservation
    const navigateWithLoadingState = useCallback(
        async (url: string, options?: { preserveContext?: boolean }) => {
            try {
                // Store current focus and context
                storeFocusedElement();
                if (options?.preserveContext !== false) {
                    setReturnContext();
                }

                // Set loading state
                setNavigationState({
                    isNavigating: true,
                    targetUrl: url,
                    returnContext: returnContextRef.current,
                });

                // Add a small delay to show loading indicator
                await new Promise(resolve => setTimeout(resolve, 100));

                // Navigate
                router.push(url);

                // Clear loading state after navigation
                setTimeout(() => {
                    setNavigationState(prev => ({ ...prev, isNavigating: false }));
                }, 500);

            } catch (error) {
                console.error("Navigation error:", error);
                setNavigationState(prev => ({ ...prev, isNavigating: false }));
            }
        },
        [router, storeFocusedElement, setReturnContext]
    );

    // Navigate to project details
    const navigateToProject = useCallback(
        async (projectId: string) => {
            await navigateWithLoadingState(`/dashboard/auftraege/${projectId}`);
        },
        [navigateWithLoadingState]
    );

    // Navigate to deadline action page
    const navigateToDeadline = useCallback(
        async (deadlineId: string, orderId: string, deadlineType?: string) => {
            let url = `/dashboard/auftraege/${orderId}`;

            // Add specific anchor or path based on deadline type
            switch (deadlineType) {
                case "milestone":
                    url += "#milestones";
                    break;
                case "application_response":
                    url += "/applications";
                    break;
                default:
                    // Default to order details
                    break;
            }

            await navigateWithLoadingState(url);
        },
        [navigateWithLoadingState]
    );

    // Navigate to orders list with active filter
    const navigateToOrdersList = useCallback(
        async () => {
            await navigateWithLoadingState("/dashboard/auftraege?filter=active");
        },
        [navigateWithLoadingState]
    );

    // Navigate to calendar/deadlines view
    const navigateToCalendar = useCallback(
        async () => {
            await navigateWithLoadingState("/dashboard/kalender?view=deadlines");
        },
        [navigateWithLoadingState]
    );

    // Clean up navigation state on unmount
    useEffect(() => {
        return () => {
            setNavigationState({ isNavigating: false });
        };
    }, []);

    // Handle browser back/forward navigation
    useEffect(() => {
        const handlePopState = () => {
            // If we have return context and we're back to the original page, restore focus
            if (returnContextRef.current?.url === pathname) {
                handleFocusReturn();
            }
        };

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, [pathname, handleFocusReturn]);

    return {
        isNavigating: navigationState.isNavigating,
        navigateToProject,
        navigateToDeadline,
        navigateToOrdersList,
        navigateToCalendar,
        setReturnContext,
        getReturnUrl,
        handleFocusReturn,
    };
}