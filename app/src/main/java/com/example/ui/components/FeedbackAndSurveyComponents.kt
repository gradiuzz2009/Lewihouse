package com.example.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.semantics.*
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.data.language.StringsDict
import com.example.data.model.MaintenanceTicket
import com.example.data.model.SatisfactionSurvey
import com.example.data.model.ServiceFeedback
import com.example.ui.theme.*

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun InteractiveStarRating(
    rating: Int,
    onRatingChanged: (Int) -> Unit,
    maxStars: Int = 5,
    starSize: Int = 36,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        for (i in 1..maxStars) {
            val isSelected = i <= rating
            IconButton(
                onClick = { onRatingChanged(i) },
                modifier = Modifier
                    .size((starSize + 12).dp)
                    .testTag("star_rating_$i")
            ) {
                Icon(
                    imageVector = if (isSelected) Icons.Default.Star else Icons.Outlined.StarBorder,
                    contentDescription = "$i Stars",
                    tint = if (isSelected) Gold500 else Slate300,
                    modifier = Modifier.size(starSize.dp)
                )
            }
        }
    }
}

@Composable
fun ReadOnlyStarRating(
    rating: Int,
    maxStars: Int = 5,
    starSize: Int = 16,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier.semantics(mergeDescendants = true) {
            contentDescription = "$rating out of $maxStars stars"
        },
        horizontalArrangement = Arrangement.spacedBy(2.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        for (i in 1..maxStars) {
            Icon(
                imageVector = if (i <= rating) Icons.Default.Star else Icons.Outlined.StarBorder,
                contentDescription = null,
                tint = if (i <= rating) Gold500 else Slate300,
                modifier = Modifier.size(starSize.dp)
            )
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ServiceFeedbackRatingDialog(
    ticket: MaintenanceTicket,
    strings: StringsDict,
    onDismiss: () -> Unit,
    onSubmit: (rating: Int, aspects: List<String>, comment: String) -> Unit
) {
    var rating by remember { mutableStateOf(5) }
    val availableAspects = listOf(
        "Punctual & Fast",
        "Clean Work",
        "Polite & Courteous",
        "Solved on 1st Visit",
        "Clear Explanations"
    )
    val selectedAspects = remember { mutableStateListOf<String>("Punctual & Fast", "Clean Work") }
    var comment by remember { mutableStateOf("") }

    val ratingLabels = mapOf(
        1 to "Very Poor",
        2 to "Needs Improvement",
        3 to "Satisfactory",
        4 to "Very Good",
        5 to "Outstanding Service!"
    )

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            shape = RoundedCornerShape(24.dp),
            color = Color.White,
            modifier = Modifier
                .fillMaxWidth(0.92f)
                .padding(vertical = 24.dp)
                .testTag("dialog_service_feedback")
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Header Icon
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .clip(CircleShape)
                        .background(Gold500.copy(alpha = 0.12f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.ThumbUp,
                        contentDescription = null,
                        tint = Gold600,
                        modifier = Modifier.size(32.dp)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = strings.rateService,
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontWeight = FontWeight.Bold,
                        color = Navy800
                    )
                )

                Text(
                    text = strings.rateServicePrompt,
                    style = MaterialTheme.typography.bodyMedium.copy(
                        color = SleekTextSecondary,
                        textAlign = TextAlign.Center
                    ),
                    modifier = Modifier.padding(top = 4.dp, bottom = 12.dp)
                )

                // Ticket Info Pill Card
                Surface(
                    shape = RoundedCornerShape(14.dp),
                    color = Slate50,
                    border = androidx.compose.foundation.BorderStroke(1.dp, Slate200),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "Ticket: ${ticket.title}",
                                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold, color = Navy800)
                            )
                            Text(
                                text = "Room ${ticket.roomNumber}",
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold, color = Gold600)
                            )
                        }
                        if (!ticket.assignedTechnician.isNullOrBlank()) {
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.Engineering,
                                    contentDescription = null,
                                    tint = Slate500,
                                    modifier = Modifier.size(14.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = "Technician: ${ticket.assignedTechnician}",
                                    style = MaterialTheme.typography.bodySmall.copy(color = Slate600)
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Star Rating
                InteractiveStarRating(
                    rating = rating,
                    onRatingChanged = { rating = it },
                    starSize = 36
                )

                Text(
                    text = ratingLabels[rating] ?: "",
                    style = MaterialTheme.typography.titleSmall.copy(
                        fontWeight = FontWeight.Bold,
                        color = if (rating >= 4) Emerald700 else if (rating == 3) Gold600 else MaterialTheme.colorScheme.error
                    ),
                    modifier = Modifier.padding(top = 6.dp, bottom = 16.dp)
                )

                // Aspect Selection Chips
                Text(
                    text = "What went well?",
                    style = MaterialTheme.typography.labelMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = Navy800
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 8.dp)
                )

                FlowRow(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    availableAspects.forEach { aspect ->
                        val isSelected = selectedAspects.contains(aspect)
                        Surface(
                            shape = RoundedCornerShape(20.dp),
                            color = if (isSelected) Navy800 else Slate100,
                            modifier = Modifier
                                .minimumInteractiveComponentSize()
                                .clickable(
                                    role = Role.Checkbox,
                                    onClickLabel = if (isSelected) "Deselect $aspect" else "Select $aspect"
                                ) {
                                    if (isSelected) selectedAspects.remove(aspect)
                                    else selectedAspects.add(aspect)
                                }
                                .testTag("chip_aspect_$aspect")
                        ) {
                            Text(
                                text = aspect,
                                style = MaterialTheme.typography.bodySmall.copy(
                                    fontWeight = FontWeight.Medium,
                                    color = if (isSelected) Color.White else Slate700
                                ),
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Optional Comments Field
                OutlinedTextField(
                    value = comment,
                    onValueChange = { comment = it },
                    label = { Text("Optional feedback or notes") },
                    placeholder = { Text("Share any details with our management...") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("input_feedback_comment"),
                    minLines = 3,
                    maxLines = 5,
                    shape = RoundedCornerShape(12.dp)
                )

                Spacer(modifier = Modifier.height(24.dp))

                // Actions
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp)
                            .testTag("btn_cancel_feedback"),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(strings.cancel)
                    }

                    Button(
                        onClick = {
                            onSubmit(rating, selectedAspects.toList(), comment)
                        },
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp)
                            .testTag("btn_submit_feedback"),
                        colors = ButtonDefaults.buttonColors(containerColor = Navy800),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(strings.submitFeedback, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun SatisfactionSurveyDialog(
    residentName: String,
    roomNumber: String,
    residentId: String,
    strings: StringsDict,
    onDismiss: () -> Unit,
    onSubmit: (
        overallRating: Int,
        cleanlinessRating: Int,
        staffRating: Int,
        amenitiesRating: Int,
        securityRating: Int,
        favoriteAspect: String,
        suggestions: String
    ) -> Unit
) {
    var currentStep by remember { mutableStateOf(1) } // 1: Star Ratings, 2: Written Feedback
    var overallRating by remember { mutableStateOf(5) }
    var cleanlinessRating by remember { mutableStateOf(5) }
    var staffRating by remember { mutableStateOf(5) }
    var amenitiesRating by remember { mutableStateOf(4) }
    var securityRating by remember { mutableStateOf(5) }

    var favoriteAspect by remember { mutableStateOf("") }
    var suggestions by remember { mutableStateOf("") }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            shape = RoundedCornerShape(24.dp),
            color = Color.White,
            modifier = Modifier
                .fillMaxWidth(0.94f)
                .fillMaxHeight(0.90f)
                .padding(vertical = 16.dp)
                .testTag("dialog_satisfaction_survey")
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(20.dp)
            ) {
                // Header with Step Pill & Close Button
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(Gold500.copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Poll,
                                contentDescription = null,
                                tint = Gold600,
                                modifier = Modifier.size(22.dp)
                            )
                        }
                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text(
                                    text = strings.surveyTitle,
                                    style = MaterialTheme.typography.titleMedium.copy(
                                        fontWeight = FontWeight.Bold,
                                        color = Navy800
                                    )
                                )
                                Surface(shape = RoundedCornerShape(6.dp), color = Slate100) {
                                    Text(
                                        text = "Step $currentStep of 2",
                                        style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Slate700),
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                }
                            }
                            Text(
                                text = "Unit $roomNumber • $residentName",
                                style = MaterialTheme.typography.labelSmall.copy(color = SleekTextSecondary)
                            )
                        }
                    }

                    IconButton(
                        onClick = onDismiss,
                        modifier = Modifier.testTag("btn_close_survey")
                    ) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = Slate500)
                    }
                }

                HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp), color = Slate100)

                // Step Content Area
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .verticalScroll(rememberScrollState())
                ) {
                    if (currentStep == 1) {
                        Text(
                            text = "Rate your living experience across core categories:",
                            style = MaterialTheme.typography.bodySmall.copy(
                                color = SleekTextSecondary,
                                lineHeight = 18.sp
                            ),
                            modifier = Modifier.padding(bottom = 14.dp)
                        )

                        // 1. Overall Living Experience
                        SurveyRatingRow(
                            title = strings.overallExperience,
                            subtitle = "Overall satisfaction residing at Lewi House",
                            rating = overallRating,
                            onRatingChanged = { overallRating = it }
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        // 2. Cleanliness
                        SurveyRatingRow(
                            title = strings.cleanlinessRating,
                            subtitle = "Common areas, corridors, trash management",
                            rating = cleanlinessRating,
                            onRatingChanged = { cleanlinessRating = it }
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        // 3. Staff & Responsiveness
                        SurveyRatingRow(
                            title = strings.staffResponsiveness,
                            subtitle = "Building manager assistance & fast communication",
                            rating = staffRating,
                            onRatingChanged = { staffRating = it }
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        // 4. Amenities & Utilities
                        SurveyRatingRow(
                            title = strings.amenitiesQuality,
                            subtitle = "Wi-Fi speed, AC performance, hot water supply",
                            rating = amenitiesRating,
                            onRatingChanged = { amenitiesRating = it }
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        // 5. Security & Safety
                        SurveyRatingRow(
                            title = strings.securitySafety,
                            subtitle = "Access control, CCTV, quiet rest atmosphere",
                            rating = securityRating,
                            onRatingChanged = { securityRating = it }
                        )
                    } else {
                        Text(
                            text = "Help us improve with your personal feedback:",
                            style = MaterialTheme.typography.bodySmall.copy(
                                color = SleekTextSecondary,
                                lineHeight = 18.sp
                            ),
                            modifier = Modifier.padding(bottom = 16.dp)
                        )

                        OutlinedTextField(
                            value = favoriteAspect,
                            onValueChange = { favoriteAspect = it },
                            label = { Text(strings.whatDidYouLike) },
                            placeholder = { Text("e.g. Fast Wi-Fi, responsive building manager, quiet environment") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("input_survey_favorite"),
                            minLines = 3,
                            shape = RoundedCornerShape(12.dp)
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        OutlinedTextField(
                            value = suggestions,
                            onValueChange = { suggestions = it },
                            label = { Text(strings.howCanWeImprove) },
                            placeholder = { Text("e.g. Add water dispenser on 2nd floor, gym equipment") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("input_survey_suggestions"),
                            minLines = 4,
                            maxLines = 6,
                            shape = RoundedCornerShape(12.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))
                }

                // Action Bar
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    if (currentStep == 2) {
                        OutlinedButton(
                            onClick = { currentStep = 1 },
                            modifier = Modifier
                                .weight(1f)
                                .height(48.dp),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("← Back")
                        }
                    }

                    Button(
                        onClick = {
                            if (currentStep == 1) {
                                currentStep = 2
                            } else {
                                onSubmit(
                                    overallRating,
                                    cleanlinessRating,
                                    staffRating,
                                    amenitiesRating,
                                    securityRating,
                                    favoriteAspect,
                                    suggestions
                                )
                            }
                        },
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp)
                            .testTag("btn_submit_survey"),
                        colors = ButtonDefaults.buttonColors(containerColor = Navy800),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(
                            text = if (currentStep == 1) "Next: Written Feedback →" else strings.submitFeedback,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun SurveyRatingRow(
    title: String,
    subtitle: String,
    rating: Int,
    onRatingChanged: (Int) -> Unit
) {
    Surface(
        shape = RoundedCornerShape(14.dp),
        color = Slate50,
        border = androidx.compose.foundation.BorderStroke(1.dp, Slate200),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.bodyMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = Navy800
                        )
                    )
                    Text(
                        text = subtitle,
                        style = MaterialTheme.typography.labelSmall.copy(color = SleekTextSecondary)
                    )
                }
                Text(
                    text = "$rating / 5",
                    style = MaterialTheme.typography.labelLarge.copy(
                        fontWeight = FontWeight.ExtraBold,
                        color = if (rating >= 4) Emerald700 else Gold600
                    ),
                    modifier = Modifier.padding(start = 8.dp)
                )
            }

            InteractiveStarRating(
                rating = rating,
                onRatingChanged = onRatingChanged,
                starSize = 26,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun AdminFeedbackOverviewDialog(
    feedbacks: List<ServiceFeedback>,
    surveys: List<SatisfactionSurvey>,
    strings: StringsDict,
    onDismiss: () -> Unit
) {
    var selectedTab by remember { mutableStateOf(0) } // 0: Service Feedbacks, 1: Surveys

    val avgFeedbackRating = if (feedbacks.isNotEmpty()) feedbacks.map { it.rating }.average() else 0.0
    val avgSurveyRating = if (surveys.isNotEmpty()) surveys.map { it.overallRating }.average() else 0.0

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            shape = RoundedCornerShape(24.dp),
            color = Color.White,
            modifier = Modifier
                .fillMaxWidth(0.94f)
                .fillMaxHeight(0.92f)
                .padding(vertical = 16.dp)
                .testTag("dialog_admin_feedback_overview")
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(20.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = strings.tenantFeedbackOverview,
                            style = MaterialTheme.typography.titleLarge.copy(
                                fontWeight = FontWeight.Bold,
                                color = Navy800
                            )
                        )
                        Text(
                            text = "Customer Satisfaction (CSAT) & Quality Reports",
                            style = MaterialTheme.typography.bodySmall.copy(color = SleekTextSecondary)
                        )
                    }

                    IconButton(
                        onClick = onDismiss,
                        modifier = Modifier.testTag("btn_close_feedback_overview")
                    ) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = Slate500)
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // CSAT Score Cards
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = Gold500.copy(alpha = 0.10f),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Gold500.copy(alpha = 0.30f)),
                        modifier = Modifier.weight(1f)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text(
                                text = "Repair Rating",
                                style = MaterialTheme.typography.labelSmall.copy(color = Gold600, fontWeight = FontWeight.Bold)
                            )
                            Row(
                                verticalAlignment = Alignment.Bottom,
                                horizontalArrangement = Arrangement.spacedBy(4.dp),
                                modifier = Modifier.padding(vertical = 4.dp)
                            ) {
                                Text(
                                    text = String.format("%.1f", avgFeedbackRating),
                                    style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.ExtraBold, color = Navy800)
                                )
                                Text(
                                    text = "/ 5.0",
                                    style = MaterialTheme.typography.bodySmall.copy(color = SleekTextSecondary),
                                    modifier = Modifier.padding(bottom = 4.dp)
                                )
                            }
                            Text(
                                text = "${feedbacks.size} service reviews",
                                style = MaterialTheme.typography.labelSmall.copy(color = Slate600)
                            )
                        }
                    }

                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = Emerald500.copy(alpha = 0.10f),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Emerald500.copy(alpha = 0.30f)),
                        modifier = Modifier.weight(1f)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text(
                                text = "Overall CSAT",
                                style = MaterialTheme.typography.labelSmall.copy(color = Emerald700, fontWeight = FontWeight.Bold)
                            )
                            Row(
                                verticalAlignment = Alignment.Bottom,
                                horizontalArrangement = Arrangement.spacedBy(4.dp),
                                modifier = Modifier.padding(vertical = 4.dp)
                            ) {
                                Text(
                                    text = String.format("%.1f", avgSurveyRating),
                                    style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.ExtraBold, color = Navy800)
                                )
                                Text(
                                    text = "/ 5.0",
                                    style = MaterialTheme.typography.bodySmall.copy(color = SleekTextSecondary),
                                    modifier = Modifier.padding(bottom = 4.dp)
                                )
                            }
                            Text(
                                text = "${surveys.size} tenant surveys",
                                style = MaterialTheme.typography.labelSmall.copy(color = Slate600)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Tab Switcher
                TabRow(
                    selectedTabIndex = selectedTab,
                    containerColor = Color.White,
                    contentColor = Navy800,
                    divider = { HorizontalDivider(color = Slate200) }
                ) {
                    Tab(
                        selected = selectedTab == 0,
                        onClick = { selectedTab = 0 },
                        text = { Text("Service Reviews (${feedbacks.size})", fontWeight = FontWeight.SemiBold) }
                    )
                    Tab(
                        selected = selectedTab == 1,
                        onClick = { selectedTab = 1 },
                        text = { Text("Satisfaction Surveys (${surveys.size})", fontWeight = FontWeight.SemiBold) }
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                // List Items
                if (selectedTab == 0) {
                    if (feedbacks.isEmpty()) {
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxWidth(),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("No service feedback recorded yet.", color = SleekTextSecondary)
                        }
                    } else {
                        LazyColumn(
                            modifier = Modifier.weight(1f),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            items(feedbacks) { fb ->
                                Surface(
                                    shape = RoundedCornerShape(14.dp),
                                    color = Slate50,
                                    border = androidx.compose.foundation.BorderStroke(1.dp, Slate200),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Column(modifier = Modifier.padding(14.dp)) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Column {
                                                Text(
                                                    text = fb.residentName,
                                                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold, color = Navy800)
                                                )
                                                Text(
                                                    text = "Room ${fb.roomNumber} • ${fb.ticketTitle}",
                                                    style = MaterialTheme.typography.bodySmall.copy(color = SleekTextSecondary)
                                                )
                                            }
                                            ReadOnlyStarRating(rating = fb.rating, starSize = 16)
                                        }

                                        if (!fb.technicianName.isNullOrBlank()) {
                                            Spacer(modifier = Modifier.height(6.dp))
                                            Text(
                                                text = "Technician: ${fb.technicianName}",
                                                style = MaterialTheme.typography.labelSmall.copy(color = Slate600, fontWeight = FontWeight.Medium)
                                            )
                                        }

                                        if (fb.aspects.isNotEmpty()) {
                                            Spacer(modifier = Modifier.height(8.dp))
                                            FlowRow(
                                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                                verticalArrangement = Arrangement.spacedBy(6.dp)
                                            ) {
                                                fb.aspects.forEach { aspect ->
                                                    Surface(
                                                        shape = RoundedCornerShape(12.dp),
                                                        color = Navy800.copy(alpha = 0.08f)
                                                    ) {
                                                        Text(
                                                            text = aspect,
                                                            style = MaterialTheme.typography.labelSmall.copy(color = Navy800, fontWeight = FontWeight.Medium),
                                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                                        )
                                                    }
                                                }
                                            }
                                        }

                                        if (!fb.comment.isNullOrBlank()) {
                                            Spacer(modifier = Modifier.height(8.dp))
                                            Text(
                                                text = "\"${fb.comment}\"",
                                                style = MaterialTheme.typography.bodySmall.copy(color = Slate700, fontStyle = androidx.compose.ui.text.font.FontStyle.Italic)
                                            )
                                        }

                                        Spacer(modifier = Modifier.height(6.dp))
                                        Text(
                                            text = fb.createdAt,
                                            style = MaterialTheme.typography.labelSmall.copy(color = Slate400, fontSize = 10.sp),
                                            modifier = Modifier.align(Alignment.End)
                                        )
                                    }
                                }
                            }
                        }
                    }
                } else {
                    if (surveys.isEmpty()) {
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxWidth(),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("No satisfaction surveys recorded yet.", color = SleekTextSecondary)
                        }
                    } else {
                        LazyColumn(
                            modifier = Modifier.weight(1f),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(surveys) { srv ->
                                Surface(
                                    shape = RoundedCornerShape(14.dp),
                                    color = Slate50,
                                    border = androidx.compose.foundation.BorderStroke(1.dp, Slate200),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Column(modifier = Modifier.padding(14.dp)) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Column {
                                                Text(
                                                    text = "${srv.residentName} (Room ${srv.roomNumber})",
                                                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold, color = Navy800)
                                                )
                                                Text(
                                                    text = srv.surveyPeriod,
                                                    style = MaterialTheme.typography.labelSmall.copy(color = SleekTextSecondary)
                                                )
                                            }
                                            ReadOnlyStarRating(rating = srv.overallRating, starSize = 16)
                                        }

                                        Spacer(modifier = Modifier.height(10.dp))

                                        // Dimension pills
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            SurveyMetricBadge("Cleanliness", srv.cleanlinessRating)
                                            SurveyMetricBadge("Staff", srv.staffResponsivenessRating)
                                            SurveyMetricBadge("Amenities", srv.amenitiesRating)
                                            SurveyMetricBadge("Security", srv.securityRating)
                                        }

                                        if (!srv.favoriteAspect.isNullOrBlank()) {
                                            Spacer(modifier = Modifier.height(8.dp))
                                            Text(
                                                text = "Liked: ${srv.favoriteAspect}",
                                                style = MaterialTheme.typography.bodySmall.copy(color = Emerald700)
                                            )
                                        }

                                        if (!srv.suggestions.isNullOrBlank()) {
                                            Spacer(modifier = Modifier.height(4.dp))
                                            Text(
                                                text = "Suggestion: ${srv.suggestions}",
                                                style = MaterialTheme.typography.bodySmall.copy(color = Slate700)
                                            )
                                        }

                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            text = srv.submittedAt,
                                            style = MaterialTheme.typography.labelSmall.copy(color = Slate400, fontSize = 10.sp),
                                            modifier = Modifier.align(Alignment.End)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SurveyMetricBadge(label: String, rating: Int) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = label, style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp, color = Slate500))
        Text(
            text = "$rating ★",
            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold, color = Gold600)
        )
    }
}
