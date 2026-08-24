package com.example.data.model

data class ServiceFeedback(
    val id: String,
    val ticketId: String,
    val ticketTitle: String,
    val residentId: String,
    val residentName: String,
    val roomNumber: String,
    val technicianName: String?,
    val rating: Int, // 1 to 5
    val aspects: List<String>, // e.g. "Punctual", "Clean", "Polite", "Effective"
    val comment: String,
    val createdAt: String
)

data class SatisfactionSurvey(
    val id: String,
    val residentId: String,
    val residentName: String,
    val roomNumber: String,
    val surveyPeriod: String, // e.g. "Q3 2026 Stay Satisfaction"
    val overallRating: Int, // 1 to 5
    val cleanlinessRating: Int,
    val staffResponsivenessRating: Int,
    val amenitiesRating: Int,
    val securityRating: Int,
    val favoriteAspect: String,
    val suggestions: String,
    val submittedAt: String
)
