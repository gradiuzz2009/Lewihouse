import React from "react";
import TenantOnboardingCarousel from "./TenantOnboardingCarousel";
import AdminSpotlightTour from "./AdminSpotlightTour";

export default function OnboardingTourModal({
  open,
  onClose,
  mode = "tenant", // "tenant" | "admin" | "owner"
  onComplete,
}) {
  if (!open) return null;

  if (mode === "tenant") {
    return (
      <TenantOnboardingCarousel
        open={open}
        onClose={onClose}
        onComplete={onComplete}
      />
    );
  }

  return (
    <AdminSpotlightTour
      open={open}
      onClose={onClose}
      onComplete={onComplete}
    />
  );
}
