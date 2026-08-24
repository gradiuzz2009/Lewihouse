package com.example.data.local

import com.example.data.model.*

object InitialData {
    val rooms = listOf(
        RoomEntity(
            id = "room_101",
            roomNumber = "101",
            type = UnitType.STANDARD.name,
            floor = 1,
            monthlyRate = 2800000.0,
            status = UnitStatus.OCCUPIED.name,
            amenities = "En-suite Bath, Single Bed, High-Speed WiFi, Work Desk, Wardrobe",
            sizeSqm = 18.0,
            electricityMeterId = "PLN-101-84920",
            currentResidentId = "res_101",
            currentResidentName = "Kevin Hartono",
            notes = "Ground floor easy access"
        ),
        RoomEntity(
            id = "room_102",
            roomNumber = "102",
            type = UnitType.STANDARD.name,
            floor = 1,
            monthlyRate = 2800000.0,
            status = UnitStatus.VACANT.name,
            amenities = "En-suite Bath, Single Bed, High-Speed WiFi, Work Desk, Wardrobe",
            sizeSqm = 18.0,
            electricityMeterId = "PLN-102-84921",
            currentResidentId = null,
            currentResidentName = null,
            notes = "Ready for immediate move-in, freshly painted"
        ),
        RoomEntity(
            id = "room_103",
            roomNumber = "103",
            type = UnitType.STANDARD.name,
            floor = 1,
            monthlyRate = 2800000.0,
            status = UnitStatus.OCCUPIED.name,
            amenities = "En-suite Bath, Single Bed, High-Speed WiFi, Work Desk, Wardrobe",
            sizeSqm = 18.0,
            electricityMeterId = "PLN-103-84922",
            currentResidentId = "res_103",
            currentResidentName = "Rina Anggraini",
            notes = "Notice to move out at end of month"
        ),
        RoomEntity(
            id = "room_201",
            roomNumber = "201",
            type = UnitType.DELUXE.name,
            floor = 2,
            monthlyRate = 3800000.0,
            status = UnitStatus.OCCUPIED.name,
            amenities = "Queen Bed, AC Inverter, Smart TV 43\", Hot Shower, Workstation, Mini Fridge",
            sizeSqm = 24.0,
            electricityMeterId = "PLN-201-94012",
            currentResidentId = "res_201",
            currentResidentName = "Dr. Andrew Wijaya",
            notes = "Quiet corner unit"
        ),
        RoomEntity(
            id = "room_202",
            roomNumber = "202",
            type = UnitType.DELUXE.name,
            floor = 2,
            monthlyRate = 3800000.0,
            status = UnitStatus.VACANT.name,
            amenities = "Queen Bed, AC Inverter, Smart TV 43\", Hot Shower, Workstation, Mini Fridge",
            sizeSqm = 24.0,
            electricityMeterId = "PLN-202-94013",
            currentResidentId = null,
            currentResidentName = null,
            notes = "Ready for occupancy"
        ),
        RoomEntity(
            id = "room_203",
            roomNumber = "203",
            type = UnitType.DELUXE.name,
            floor = 2,
            monthlyRate = 3800000.0,
            status = UnitStatus.MAINTENANCE.name,
            amenities = "Queen Bed, AC Inverter, Smart TV 43\", Hot Shower, Workstation, Mini Fridge",
            sizeSqm = 24.0,
            electricityMeterId = "PLN-203-94014",
            currentResidentId = null,
            currentResidentName = null,
            notes = "AC compressor servicing in progress"
        ),
        RoomEntity(
            id = "room_204",
            roomNumber = "204",
            type = UnitType.DELUXE.name,
            floor = 2,
            monthlyRate = 3800000.0,
            status = UnitStatus.OCCUPIED.name,
            amenities = "Queen Bed, AC Inverter, Smart TV 43\", Hot Shower, Workstation, Mini Fridge",
            sizeSqm = 24.0,
            electricityMeterId = "PLN-204-94015",
            currentResidentId = "res_204",
            currentResidentName = "Fauzie Ali Akhmad",
            notes = "Tenant preferred long-term"
        ),
        RoomEntity(
            id = "room_301",
            roomNumber = "301",
            type = UnitType.PREMIUM.name,
            floor = 3,
            monthlyRate = 4900000.0,
            status = UnitStatus.OCCUPIED.name,
            amenities = "King Bed, Private Balcony, 50\" 4K TV, Refrigerator, Microwave, Work Studio",
            sizeSqm = 32.0,
            electricityMeterId = "PLN-301-11823",
            currentResidentId = "res_301",
            currentResidentName = "Sarah Jenkins",
            notes = "Top floor city skyline view"
        ),
        RoomEntity(
            id = "room_302",
            roomNumber = "302",
            type = UnitType.PREMIUM.name,
            floor = 3,
            monthlyRate = 4900000.0,
            status = UnitStatus.VACANT.name,
            amenities = "King Bed, Private Balcony, 50\" 4K TV, Refrigerator, Microwave, Work Studio",
            sizeSqm = 32.0,
            electricityMeterId = "PLN-302-11824",
            currentResidentId = null,
            currentResidentName = null,
            notes = "Available for booking"
        ),
        RoomEntity(
            id = "room_303",
            roomNumber = "303",
            type = UnitType.EXECUTIVE.name,
            floor = 3,
            monthlyRate = 6500000.0,
            status = UnitStatus.OCCUPIED.name,
            amenities = "Master Bedroom, Living Lounge, Kitchenette, Bathtub, High-Ceiling Balcony, Smart Lock",
            sizeSqm = 45.0,
            electricityMeterId = "PLN-303-11825",
            currentResidentId = "res_303",
            currentResidentName = "Michael Pratama",
            notes = "Executive Penthouse Suite"
        )
    )

    val residents = listOf(
        ResidentEntity(
            id = "res_204",
            fullName = "Fauzie Ali Akhmad",
            email = "fauziealiakhmad@gmail.com",
            phone = "+62 812-8829-1920",
            roomNumber = "204",
            moveInDate = "2026-01-15",
            leaseEndDate = "2027-01-14",
            monthlyRent = 3800000.0,
            depositAmount = 3800000.0,
            outstandingDebt = 0.0,
            emergencyContact = "Siti Rahma (Spouse)",
            emergencyPhone = "+62 813-9912-0043",
            ktpNumber = "3271041990080002",
            status = ResidentStatus.ACTIVE.name,
            avatarIndex = 0
        ),
        ResidentEntity(
            id = "res_301",
            fullName = "Sarah Jenkins",
            email = "sarah.j@techpacific.co",
            phone = "+62 811-3049-9210",
            roomNumber = "301",
            moveInDate = "2025-11-01",
            leaseEndDate = "2026-11-01",
            monthlyRent = 4900000.0,
            depositAmount = 4900000.0,
            outstandingDebt = 4900000.0, // Bill issued for current period
            emergencyContact = "Liam Jenkins (Brother)",
            emergencyPhone = "+61 491-570-156",
            ktpNumber = "PASSPORT-A9920184",
            status = ResidentStatus.ACTIVE.name,
            avatarIndex = 1
        ),
        ResidentEntity(
            id = "res_101",
            fullName = "Kevin Hartono",
            email = "kevin.hartono@startup.id",
            phone = "+62 819-0129-4819",
            roomNumber = "101",
            moveInDate = "2026-02-01",
            leaseEndDate = "2026-08-31",
            monthlyRent = 2800000.0,
            depositAmount = 2800000.0,
            outstandingDebt = 0.0,
            emergencyContact = "Budi Hartono (Father)",
            emergencyPhone = "+62 812-7711-2299",
            ktpNumber = "3174052001920003",
            status = ResidentStatus.ACTIVE.name,
            avatarIndex = 2
        ),
        ResidentEntity(
            id = "res_103",
            fullName = "Rina Anggraini",
            email = "rina.ang@corp.co.id",
            phone = "+62 856-4920-1120",
            roomNumber = "103",
            moveInDate = "2025-09-01",
            leaseEndDate = "2026-08-31",
            monthlyRent = 2800000.0,
            depositAmount = 2800000.0,
            outstandingDebt = 0.0,
            emergencyContact = "Dewi Anggraini (Mother)",
            emergencyPhone = "+62 815-6677-8899",
            ktpNumber = "3273016508930004",
            status = ResidentStatus.MOVING_OUT.name,
            avatarIndex = 3
        ),
        ResidentEntity(
            id = "res_201",
            fullName = "Dr. Andrew Wijaya",
            email = "dr.andrew@medika.org",
            phone = "+62 813-2289-4019",
            roomNumber = "201",
            moveInDate = "2025-06-01",
            leaseEndDate = "2027-05-31",
            monthlyRent = 3800000.0,
            depositAmount = 3800000.0,
            outstandingDebt = 0.0,
            emergencyContact = "Clara Wijaya (Sister)",
            emergencyPhone = "+62 812-3344-5566",
            ktpNumber = "3171021405880005",
            status = ResidentStatus.ACTIVE.name,
            avatarIndex = 4
        ),
        ResidentEntity(
            id = "res_303",
            fullName = "Michael Pratama",
            email = "m.pratama@capital.sg",
            phone = "+62 818-0909-8877",
            roomNumber = "303",
            moveInDate = "2026-03-01",
            leaseEndDate = "2027-02-28",
            monthlyRent = 6500000.0,
            depositAmount = 6500000.0,
            outstandingDebt = 6500000.0,
            emergencyContact = "Hendra Pratama (Father)",
            emergencyPhone = "+62 811-9876-5432",
            ktpNumber = "3175082203910006",
            status = ResidentStatus.ACTIVE.name,
            avatarIndex = 5
        )
    )

    val payments = listOf(
        PaymentEntity(
            id = "pay_001",
            residentId = "res_204",
            residentName = "Fauzie Ali Akhmad",
            roomNumber = "204",
            amount = 3800000.0,
            type = PaymentType.RENT.name,
            status = PaymentStatus.PAID.name,
            date = "2026-08-15",
            dueDate = "2026-08-15",
            paymentMethod = PaymentMethod.BANK_TRANSFER.name,
            receiptRef = "BCA-TRX-94829104",
            notes = "August 2026 Rent - Paid on time"
        ),
        PaymentEntity(
            id = "pay_002",
            residentId = "res_101",
            residentName = "Kevin Hartono",
            roomNumber = "101",
            amount = 2800000.0,
            type = PaymentType.RENT.name,
            status = PaymentStatus.PAID.name,
            date = "2026-08-01",
            dueDate = "2026-08-01",
            paymentMethod = PaymentMethod.QRIS.name,
            receiptRef = "QRIS-839201948",
            notes = "August 2026 Rent"
        ),
        PaymentEntity(
            id = "pay_003",
            residentId = "res_201",
            residentName = "Dr. Andrew Wijaya",
            roomNumber = "201",
            amount = 3800000.0,
            type = PaymentType.RENT.name,
            status = PaymentStatus.PAID.name,
            date = "2026-08-01",
            dueDate = "2026-08-01",
            paymentMethod = PaymentMethod.MANDIRI_VA.name,
            receiptRef = "MDR-VA-7729102",
            notes = "August 2026 Rent"
        ),
        PaymentEntity(
            id = "pay_004",
            residentId = "res_301",
            residentName = "Sarah Jenkins",
            roomNumber = "301",
            amount = 4900000.0,
            type = PaymentType.RENT.name,
            status = PaymentStatus.PENDING.name,
            date = "2026-08-20",
            dueDate = "2026-08-25",
            paymentMethod = PaymentMethod.BANK_TRANSFER.name,
            receiptRef = "PENDING-VERIF",
            notes = "August 2026 Rent - Transfer receipt uploaded"
        ),
        PaymentEntity(
            id = "pay_005",
            residentId = "res_303",
            residentName = "Michael Pratama",
            roomNumber = "303",
            amount = 6500000.0,
            type = PaymentType.RENT.name,
            status = PaymentStatus.OVERDUE.name,
            date = "2026-08-10",
            dueDate = "2026-08-10",
            paymentMethod = PaymentMethod.BANK_TRANSFER.name,
            receiptRef = "",
            notes = "Overdue 12 days - WhatsApp reminder sent"
        ),
        PaymentEntity(
            id = "pay_006",
            residentId = "res_204",
            residentName = "Fauzie Ali Akhmad",
            roomNumber = "204",
            amount = 250000.0,
            type = PaymentType.ELECTRICITY.name,
            status = PaymentStatus.PAID.name,
            date = "2026-08-18",
            dueDate = "2026-08-18",
            paymentMethod = PaymentMethod.QRIS.name,
            receiptRef = "QRIS-PLN-551029",
            notes = "PLN Token purchase (147.1 kWh)"
        )
    )

    val meters = listOf(
        ElectricityMeterEntity("m_101", "101", "PLN-101-84920", 1420.5, 1535.2, "2026-08-20", 1699.53, true),
        ElectricityMeterEntity("m_102", "102", "PLN-102-84921", 890.0, 890.0, "2026-08-20", 1699.53, false),
        ElectricityMeterEntity("m_103", "103", "PLN-103-84922", 2100.0, 2218.4, "2026-08-20", 1699.53, true),
        ElectricityMeterEntity("m_201", "201", "PLN-201-94012", 3410.2, 3590.8, "2026-08-20", 1699.53, true),
        ElectricityMeterEntity("m_202", "202", "PLN-202-94013", 120.0, 120.0, "2026-08-20", 1699.53, false),
        ElectricityMeterEntity("m_203", "203", "PLN-203-94014", 1840.0, 1855.0, "2026-08-20", 1699.53, false),
        ElectricityMeterEntity("m_204", "204", "PLN-204-94015", 2740.0, 2915.6, "2026-08-20", 1699.53, true),
        ElectricityMeterEntity("m_301", "301", "PLN-301-11823", 4120.5, 4345.0, "2026-08-20", 1699.53, true),
        ElectricityMeterEntity("m_302", "302", "PLN-302-11824", 450.0, 450.0, "2026-08-20", 1699.53, false),
        ElectricityMeterEntity("m_303", "303", "PLN-303-11825", 5320.0, 5610.2, "2026-08-20", 1699.53, true)
    )

    val tokens = listOf(
        ElectricityTokenEntity(
            id = "tok_001",
            roomNumber = "204",
            meterNumber = "PLN-204-94015",
            tokenCode = "4819-2049-5510-9281-7394",
            amountRp = 250000.0,
            kwhAmount = 147.1,
            generatedAt = "2026-08-18 14:30",
            issuedBy = "Admin Lewi House",
            status = TokenStatus.ENTERED.name,
            residentName = "Fauzie Ali Akhmad"
        ),
        ElectricityTokenEntity(
            id = "tok_002",
            roomNumber = "301",
            meterNumber = "PLN-301-11823",
            tokenCode = "8294-1102-4938-2019-4820",
            amountRp = 500000.0,
            kwhAmount = 294.2,
            generatedAt = "2026-08-10 10:15",
            issuedBy = "Admin Lewi House",
            status = TokenStatus.ENTERED.name,
            residentName = "Sarah Jenkins"
        ),
        ElectricityTokenEntity(
            id = "tok_003",
            roomNumber = "101",
            meterNumber = "PLN-101-84920",
            tokenCode = "3192-8401-9923-1482-5501",
            amountRp = 200000.0,
            kwhAmount = 117.7,
            generatedAt = "2026-08-05 16:45",
            issuedBy = "Admin Lewi House",
            status = TokenStatus.VERIFIED.name,
            residentName = "Kevin Hartono"
        )
    )

    val tickets = listOf(
        MaintenanceTicketEntity(
            id = "tkt_001",
            roomNumber = "204",
            residentId = "res_204",
            residentName = "Fauzie Ali Akhmad",
            title = "AC Water Dripping on Desk",
            category = MaintenanceCategory.AIR_CONDITIONER.name,
            description = "The indoor AC unit has small water droplets leaking from the right side tray during heavy cooling mode.",
            priority = MaintenancePriority.HIGH.name,
            status = MaintenanceStatus.IN_PROGRESS.name,
            reportedDate = "2026-08-21 09:30",
            resolvedDate = null,
            assignedTechnician = "Pak Joko (Cooling Specialist)",
            estimatedCost = 150000.0,
            photoEvidenceDesc = "Attached photo showing slight leak onto secondary catch cloth.",
            notes = "Scheduled technician visit for today 2:00 PM."
        ),
        MaintenanceTicketEntity(
            id = "tkt_002",
            roomNumber = "301",
            residentId = "res_301",
            residentName = "Sarah Jenkins",
            title = "Balcony Door Handle Loose",
            category = MaintenanceCategory.STRUCTURAL.name,
            description = "The sliding glass door latch requires extra force to lock properly.",
            priority = MaintenancePriority.MEDIUM.name,
            status = MaintenanceStatus.ASSIGNED.name,
            reportedDate = "2026-08-20 18:10",
            resolvedDate = null,
            assignedTechnician = "Budi (Building Handyman)",
            estimatedCost = 75000.0,
            photoEvidenceDesc = "Lock alignment photo.",
            notes = "Parts ordered."
        ),
        MaintenanceTicketEntity(
            id = "tkt_003",
            roomNumber = "101",
            residentId = "res_101",
            residentName = "Kevin Hartono",
            title = "Bathroom Faucet Aerator Clogged",
            category = MaintenanceCategory.PLUMBING.name,
            description = "Water flow from sink faucet is low due to mineral sediment.",
            priority = MaintenancePriority.LOW.name,
            status = MaintenanceStatus.RESOLVED.name,
            reportedDate = "2026-08-12 11:00",
            resolvedDate = "2026-08-13 14:00",
            assignedTechnician = "Budi (Building Handyman)",
            estimatedCost = 50000.0,
            photoEvidenceDesc = "Replaced aerator filter mesh.",
            notes = "Cleaned and restored optimal pressure."
        )
    )

    val feedbacks = listOf(
        ServiceFeedbackEntity(
            id = "fb_001",
            ticketId = "tkt_003",
            ticketTitle = "Bathroom Faucet Aerator Clogged",
            residentId = "res_101",
            residentName = "Kevin Hartono",
            roomNumber = "101",
            technicianName = "Budi (Building Handyman)",
            rating = 5,
            aspects = "Punctual & Fast, Clean Work, Polite & Friendly, Solved First Visit",
            comment = "Budi arrived in 20 minutes and swapped the aerator in no time. Great water pressure now!",
            createdAt = "2026-08-13 15:30"
        )
    )

    val surveys = listOf(
        SatisfactionSurveyEntity(
            id = "srv_001",
            residentId = "res_301",
            residentName = "Sarah Jenkins",
            roomNumber = "301",
            surveyPeriod = "Q3 2026 Periodic Stay Survey",
            overallRating = 5,
            cleanlinessRating = 5,
            staffResponsivenessRating = 5,
            amenitiesRating = 4,
            securityRating = 5,
            favoriteAspect = "Quiet rooftop ambiance and responsive building manager.",
            suggestions = "Could add more kettlebells to the fitness corner.",
            submittedAt = "2026-08-18 10:20"
        )
    )

    val notifications = listOf(
        AppNotificationEntity(
            id = "notif_001",
            recipientResidentId = "res_204",
            recipientName = "Fauzie Ali Akhmad",
            title = "Technician Assigned to Your Unit",
            message = "Pak Joko (Cooling Specialist) has been dispatched for 'AC Water Dripping on Desk'. Estimated arrival: 14:00.",
            category = NotificationCategory.MAINTENANCE.name,
            priority = NotificationPriority.IMPORTANT.name,
            timestamp = "2026-08-22 09:35",
            isRead = false,
            actionType = NotificationAction.VIEW_TICKET.name,
            actionPayload = "tkt_001"
        ),
        AppNotificationEntity(
            id = "notif_002",
            recipientResidentId = null, // broadcast to all
            recipientName = null,
            title = "PLN Routine Grid Inspection",
            message = "Scheduled electrical board inspection this Saturday 10:00 - 11:30 AM. Backup generator will supply common areas.",
            category = NotificationCategory.ANNOUNCEMENT.name,
            priority = NotificationPriority.NORMAL.name,
            timestamp = "2026-08-21 14:00",
            isRead = false,
            actionType = NotificationAction.VIEW_ANNOUNCEMENT.name,
            actionPayload = null
        ),
        AppNotificationEntity(
            id = "notif_003",
            recipientResidentId = "res_204",
            recipientName = "Fauzie Ali Akhmad",
            title = "Upcoming Rent Due Notice",
            message = "Your monthly rent for Unit 204 (IDR 3,800,000) is scheduled for renewal on the 1st of next month.",
            category = NotificationCategory.RENT_DUE.name,
            priority = NotificationPriority.NORMAL.name,
            timestamp = "2026-08-20 08:00",
            isRead = true,
            actionType = NotificationAction.VIEW_BILLS.name,
            actionPayload = "pay_002"
        ),
        AppNotificationEntity(
            id = "notif_004",
            recipientResidentId = "res_204",
            recipientName = "Fauzie Ali Akhmad",
            title = "Quarterly Resident Feedback Survey",
            message = "Help us elevate your stay at Lewi House! Take 1 minute to share your thoughts in our Q3 satisfaction survey.",
            category = NotificationCategory.SURVEY.name,
            priority = NotificationPriority.NORMAL.name,
            timestamp = "2026-08-19 11:15",
            isRead = false,
            actionType = NotificationAction.OPEN_SURVEY.name,
            actionPayload = "Q3 2026"
        )
    )
}

