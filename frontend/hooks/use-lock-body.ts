"use client"

import { useEffect } from "react"

// Locks the body scroll when the mobile menu is open
export function useLockBody() {
  useEffect(() => {
    // Save the original body overflow style
    const originalStyle = window.getComputedStyle(document.body).overflow

    // Prevent scrolling on mount
    document.body.style.overflow = "hidden"

    // Re-enable scrolling when component unmounts
    return () => {
      document.body.style.overflow = originalStyle
    }
  }, [])
}