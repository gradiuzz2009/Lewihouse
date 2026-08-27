import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * Custom hook to automatically refresh data when:
 * 1. User navigates between screens / routes
 * 2. Window gains focus
 * 3. Document visibility changes to visible
 */
export function useAutoRefresh(callback) {
  const location = useLocation();
  const cbRef = useRef(callback);
  cbRef.current = callback;

  // Refresh on route change
  useEffect(() => {
    cbRef.current?.();
  }, [location.pathname]);

  // Refresh on focus & tab visibility change
  useEffect(() => {
    const handleRefresh = () => {
      cbRef.current?.();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        cbRef.current?.();
      }
    };

    window.addEventListener("focus", handleRefresh);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleRefresh);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);
}

export default useAutoRefresh;
