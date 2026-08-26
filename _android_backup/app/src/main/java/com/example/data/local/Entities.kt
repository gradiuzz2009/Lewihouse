package com.example.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.example.data.model.*

@Entity(tableName = "rooms")
data class RoomEntity(
    @PrimaryKey val id: String,
    val roomNumber: String,
    val type: String, // enum name
    val floor: Int,
    val monthlyRate: Double,
    val status: String, // enum name
    val amenities: String, // comma separated
    val sizeSqm: Double,
    val electricityMeterId: String,
    val currentResidentId: String?,
    val currentResidentName: String?,
    val notes: String
) {
    fun toDomain(): RoomUnit {
        return RoomUnit(
            id = id,
            roomNumber = roomNumber,
            type = runCatching { UnitType.valueOf(type) }.getOrDefault(UnitType.STANDARD),
            floor = floor,
            monthlyRate = monthlyRate,
            status = runCatching { UnitStatus.valueOf(status) }.getOrDefault(UnitStatus.VACANT),
            amenities = if (amenities.isBlank()) emptyList() else amenities.split(",").map { it.trim() },
            sizeSqm = sizeSqm,
            electricityMeterId = electricityMeterId,
            currentResidentId = currentResidentId,
            currentResidentName = currentResidentName,
            notes = notes
        )
    }

    companion object {
        fun fromDomain(model: RoomUnit): RoomEntity {
            return RoomEntity(
                id = model.id,
                roomNumber = model.roomNumber,
                type = model.type.name,
                floor = model.floor,
                monthlyRate = model.monthlyRate,
                status = model.status.name,
                amenities = model.amenities.joinToString(","),
                sizeSqm = model.sizeSqm,
                electricityMeterId = model.electricityMeterId,
                currentResidentId = model.currentResidentId,
                currentResidentName = model.currentResidentName,
                notes = model.notes
            )
        }
    }
}

@Entity(tableName = "residents")
data class ResidentEntity(
    @PrimaryKey val id: String,
    val fullName: String,
    val email: String,
    val phone: String,
    val roomNumber: String,
    val moveInDate: String,
    val leaseEndDate: String,
    val monthlyRent: Double,
    val depositAmount: Double,
    val outstandingDebt: Double,
    val emergencyContact: String,
    val emergencyPhone: String,
    val ktpNumber: String,
    val status: String,
    val avatarIndex: Int
) {
    fun toDomain(): Resident {
        return Resident(
            id = id,
            fullName = fullName,
            email = email,
            phone = phone,
            roomNumber = roomNumber,
            moveInDate = moveInDate,
            leaseEndDate = leaseEndDate,
            monthlyRent = monthlyRent,
            depositAmount = depositAmount,
            outstandingDebt = outstandingDebt,
            emergencyContact = emergencyContact,
            emergencyPhone = emergencyPhone,
            ktpNumber = ktpNumber,
            status = runCatching { ResidentStatus.valueOf(status) }.getOrDefault(ResidentStatus.ACTIVE),
            avatarIndex = avatarIndex
        )
    }

    companion object {
        fun fromDomain(model: Resident): ResidentEntity {
            return ResidentEntity(
                id = model.id,
                fullName = model.fullName,
                email = model.email,
                phone = model.phone,
                roomNumber = model.roomNumber,
                moveInDate = model.moveInDate,
                leaseEndDate = model.leaseEndDate,
                monthlyRent = model.monthlyRent,
                depositAmount = model.depositAmount,
                outstandingDebt = model.outstandingDebt,
                emergencyContact = model.emergencyContact,
                emergencyPhone = model.emergencyPhone,
                ktpNumber = model.ktpNumber,
                status = model.status.name,
                avatarIndex = model.avatarIndex
            )
        }
    }
}

@Entity(tableName = "payments")
data class PaymentEntity(
    @PrimaryKey val id: String,
    val residentId: String,
    val residentName: String,
    val roomNumber: String,
    val amount: Double,
    val type: String,
    val status: String,
    val date: String,
    val dueDate: String,
    val paymentMethod: String,
    val receiptRef: String,
    val notes: String
) {
    fun toDomain(): Payment {
        return Payment(
            id = id,
            residentId = residentId,
            residentName = residentName,
            roomNumber = roomNumber,
            amount = amount,
            type = runCatching { PaymentType.valueOf(type) }.getOrDefault(PaymentType.RENT),
            status = runCatching { PaymentStatus.valueOf(status) }.getOrDefault(PaymentStatus.PAID),
            date = date,
            dueDate = dueDate,
            paymentMethod = runCatching { PaymentMethod.valueOf(paymentMethod) }.getOrDefault(PaymentMethod.BANK_TRANSFER),
            receiptRef = receiptRef,
            notes = notes
        )
    }

    companion object {
        fun fromDomain(model: Payment): PaymentEntity {
            return PaymentEntity(
                id = model.id,
                residentId = model.residentId,
                residentName = model.residentName,
                roomNumber = model.roomNumber,
                amount = model.amount,
                type = model.type.name,
                status = model.status.name,
                date = model.date,
                dueDate = model.dueDate,
                paymentMethod = model.paymentMethod.name,
                receiptRef = model.receiptRef,
                notes = model.notes
            )
        }
    }
}

@Entity(tableName = "electricity_meters")
data class ElectricityMeterEntity(
    @PrimaryKey val id: String,
    val roomNumber: String,
    val meterNumber: String,
    val lastReadingKwh: Double,
    val currentReadingKwh: Double,
    val readingDate: String,
    val tariffPerKwh: Double,
    val isBilled: Boolean
) {
    fun toDomain(): ElectricityMeter {
        return ElectricityMeter(
            id = id,
            roomNumber = roomNumber,
            meterNumber = meterNumber,
            lastReadingKwh = lastReadingKwh,
            currentReadingKwh = currentReadingKwh,
            readingDate = readingDate,
            tariffPerKwh = tariffPerKwh,
            isBilled = isBilled
        )
    }

    companion object {
        fun fromDomain(model: ElectricityMeter): ElectricityMeterEntity {
            return ElectricityMeterEntity(
                id = model.id,
                roomNumber = model.roomNumber,
                meterNumber = model.meterNumber,
                lastReadingKwh = model.lastReadingKwh,
                currentReadingKwh = model.currentReadingKwh,
                readingDate = model.readingDate,
                tariffPerKwh = model.tariffPerKwh,
                isBilled = model.isBilled
            )
        }
    }
}

@Entity(tableName = "electricity_tokens")
data class ElectricityTokenEntity(
    @PrimaryKey val id: String,
    val roomNumber: String,
    val meterNumber: String,
    val tokenCode: String,
    val amountRp: Double,
    val kwhAmount: Double,
    val generatedAt: String,
    val issuedBy: String,
    val status: String,
    val residentName: String
) {
    fun toDomain(): ElectricityToken {
        return ElectricityToken(
            id = id,
            roomNumber = roomNumber,
            meterNumber = meterNumber,
            tokenCode = tokenCode,
            amountRp = amountRp,
            kwhAmount = kwhAmount,
            generatedAt = generatedAt,
            issuedBy = issuedBy,
            status = runCatching { TokenStatus.valueOf(status) }.getOrDefault(TokenStatus.ISSUED),
            residentName = residentName
        )
    }

    companion object {
        fun fromDomain(model: ElectricityToken): ElectricityTokenEntity {
            return ElectricityTokenEntity(
                id = model.id,
                roomNumber = model.roomNumber,
                meterNumber = model.meterNumber,
                tokenCode = model.tokenCode,
                amountRp = model.amountRp,
                kwhAmount = model.kwhAmount,
                generatedAt = model.generatedAt,
                issuedBy = model.issuedBy,
                status = model.status.name,
                residentName = model.residentName
            )
        }
    }
}

@Entity(tableName = "maintenance_tickets")
data class MaintenanceTicketEntity(
    @PrimaryKey val id: String,
    val roomNumber: String,
    val residentId: String,
    val residentName: String,
    val title: String,
    val category: String,
    val description: String,
    val priority: String,
    val status: String,
    val reportedDate: String,
    val resolvedDate: String?,
    val assignedTechnician: String?,
    val estimatedCost: Double?,
    val photoEvidenceDesc: String?,
    val notes: String?
) {
    fun toDomain(): MaintenanceTicket {
        return MaintenanceTicket(
            id = id,
            roomNumber = roomNumber,
            residentId = residentId,
            residentName = residentName,
            title = title,
            category = runCatching { MaintenanceCategory.valueOf(category) }.getOrDefault(MaintenanceCategory.OTHER),
            description = description,
            priority = runCatching { MaintenancePriority.valueOf(priority) }.getOrDefault(MaintenancePriority.MEDIUM),
            status = runCatching { MaintenanceStatus.valueOf(status) }.getOrDefault(MaintenanceStatus.REPORTED),
            reportedDate = reportedDate,
            resolvedDate = resolvedDate,
            assignedTechnician = assignedTechnician,
            estimatedCost = estimatedCost,
            photoEvidenceDesc = photoEvidenceDesc,
            notes = notes
        )
    }

    companion object {
        fun fromDomain(model: MaintenanceTicket): MaintenanceTicketEntity {
            return MaintenanceTicketEntity(
                id = model.id,
                roomNumber = model.roomNumber,
                residentId = model.residentId,
                residentName = model.residentName,
                title = model.title,
                category = model.category.name,
                description = model.description,
                priority = model.priority.name,
                status = model.status.name,
                reportedDate = model.reportedDate,
                resolvedDate = model.resolvedDate,
                assignedTechnician = model.assignedTechnician,
                estimatedCost = model.estimatedCost,
                photoEvidenceDesc = model.photoEvidenceDesc,
                notes = model.notes
            )
        }
    }
}

@Entity(tableName = "service_feedbacks")
data class ServiceFeedbackEntity(
    @PrimaryKey val id: String,
    val ticketId: String,
    val ticketTitle: String,
    val residentId: String,
    val residentName: String,
    val roomNumber: String,
    val technicianName: String?,
    val rating: Int,
    val aspects: String, // comma-separated
    val comment: String,
    val createdAt: String
) {
    fun toDomain(): ServiceFeedback {
        return ServiceFeedback(
            id = id,
            ticketId = ticketId,
            ticketTitle = ticketTitle,
            residentId = residentId,
            residentName = residentName,
            roomNumber = roomNumber,
            technicianName = technicianName,
            rating = rating,
            aspects = if (aspects.isBlank()) emptyList() else aspects.split(",").map { it.trim() },
            comment = comment,
            createdAt = createdAt
        )
    }

    companion object {
        fun fromDomain(model: ServiceFeedback): ServiceFeedbackEntity {
            return ServiceFeedbackEntity(
                id = model.id,
                ticketId = model.ticketId,
                ticketTitle = model.ticketTitle,
                residentId = model.residentId,
                residentName = model.residentName,
                roomNumber = model.roomNumber,
                technicianName = model.technicianName,
                rating = model.rating,
                aspects = model.aspects.joinToString(","),
                comment = model.comment,
                createdAt = model.createdAt
            )
        }
    }
}

@Entity(tableName = "satisfaction_surveys")
data class SatisfactionSurveyEntity(
    @PrimaryKey val id: String,
    val residentId: String,
    val residentName: String,
    val roomNumber: String,
    val surveyPeriod: String,
    val overallRating: Int,
    val cleanlinessRating: Int,
    val staffResponsivenessRating: Int,
    val amenitiesRating: Int,
    val securityRating: Int,
    val favoriteAspect: String,
    val suggestions: String,
    val submittedAt: String
) {
    fun toDomain(): SatisfactionSurvey {
        return SatisfactionSurvey(
            id = id,
            residentId = residentId,
            residentName = residentName,
            roomNumber = roomNumber,
            surveyPeriod = surveyPeriod,
            overallRating = overallRating,
            cleanlinessRating = cleanlinessRating,
            staffResponsivenessRating = staffResponsivenessRating,
            amenitiesRating = amenitiesRating,
            securityRating = securityRating,
            favoriteAspect = favoriteAspect,
            suggestions = suggestions,
            submittedAt = submittedAt
        )
    }

    companion object {
        fun fromDomain(model: SatisfactionSurvey): SatisfactionSurveyEntity {
            return SatisfactionSurveyEntity(
                id = model.id,
                residentId = model.residentId,
                residentName = model.residentName,
                roomNumber = model.roomNumber,
                surveyPeriod = model.surveyPeriod,
                overallRating = model.overallRating,
                cleanlinessRating = model.cleanlinessRating,
                staffResponsivenessRating = model.staffResponsivenessRating,
                amenitiesRating = model.amenitiesRating,
                securityRating = model.securityRating,
                favoriteAspect = model.favoriteAspect,
                suggestions = model.suggestions,
                submittedAt = model.submittedAt
            )
        }
    }
}

@Entity(tableName = "app_notifications")
data class AppNotificationEntity(
    @PrimaryKey val id: String,
    val recipientResidentId: String?,
    val recipientName: String?,
    val title: String,
    val message: String,
    val category: String,
    val priority: String,
    val timestamp: String,
    val isRead: Boolean,
    val actionType: String?,
    val actionPayload: String?
) {
    fun toDomain(): AppNotification {
        return AppNotification(
            id = id,
            recipientResidentId = recipientResidentId,
            recipientName = recipientName,
            title = title,
            message = message,
            category = runCatching { NotificationCategory.valueOf(category) }.getOrDefault(NotificationCategory.ANNOUNCEMENT),
            priority = runCatching { NotificationPriority.valueOf(priority) }.getOrDefault(NotificationPriority.NORMAL),
            timestamp = timestamp,
            isRead = isRead,
            actionType = actionType?.let { runCatching { NotificationAction.valueOf(it) }.getOrNull() },
            actionPayload = actionPayload
        )
    }

    companion object {
        fun fromDomain(model: AppNotification): AppNotificationEntity {
            return AppNotificationEntity(
                id = model.id,
                recipientResidentId = model.recipientResidentId,
                recipientName = model.recipientName,
                title = model.title,
                message = model.message,
                category = model.category.name,
                priority = model.priority.name,
                timestamp = model.timestamp,
                isRead = model.isRead,
                actionType = model.actionType?.name,
                actionPayload = model.actionPayload
            )
        }
    }
}

@Entity(tableName = "pending_mutations")
data class PendingMutationEntity(
    @PrimaryKey val id: String,
    val entityType: String,
    val action: String,
    val payloadJson: String,
    val createdAt: Long = System.currentTimeMillis(),
    val retryCount: Int = 0
)


