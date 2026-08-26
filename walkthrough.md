# Lewi House Kosan Management System - Database & Sync Setup Walkthrough

## Summary of Completed Tasks

### 1. Cloud Firestore Configuration & Deployment
- **Project ID**: `lewihouse-7a0d7`
- **Security Rules**: Deployed to `cloud.firestore` ([firestore.rules](file:///c:/Users/AL_AAF/Project/Android%20App/Lewi%20house%20kosan%20management/Lewi%20house-emergent/Lewihouse/firestore.rules))
  - Whitelisted owner/admin: `fauziealiakhmad@gmail.com`
  - Tenant data privacy rules and scoped property structure.
- **Indexes**: Deployed composite indexes for real-time chat, notifications, maintenance tickets, and payment history ([firestore.indexes.json](file:///c:/Users/AL_AAF/Project/Android%20App/Lewi%20house%20kosan%20management/Lewi%20house-emergent/Lewihouse/firestore.indexes.json)).

### 2. Live Database Seeding
All initial entities were created directly in Cloud Firestore:
- **Property Record**: `properties/lewi_house_main`
- **8 Kosan Rooms**:
  - Floor 1: Rooms 101, 102 (Deluxe), Rooms 103, 104 (Standard)
  - Floor 2: Rooms 201, 202 (VIP Suite), Rooms 203, 204 (Standard)
- **8 Digital Electricity Meters**: `meter_101` through `meter_204`
- **Demo Resident Record**: Budi Santoso (`resident_101`)
- **Admin Account**: `users/usr_owner_1` (`fauziealiakhmad@gmail.com`)
- **Announcements**: Welcome broadcast notification

### 3. Backend & Frontend Alignment
- **Sync Engine**: Updated [backend/firestore_sync.py](file:///c:/Users/AL_AAF/Project/Android%20App/Lewi%20house%20kosan%20management/Lewi%20house-emergent/Lewihouse/backend/firestore_sync.py) to target `lewihouse-7a0d7`.
- **Web Login & Mock Engine**: Updated [Login.jsx](file:///c:/Users/AL_AAF/Project/Android%20App/Lewi%20house%20kosan%20management/Lewi%20house-emergent/Lewihouse/frontend/src/pages/Login.jsx) and [mockData.js](file:///c:/Users/AL_AAF/Project/Android%20App/Lewi%20house%20kosan%20management/Lewi%20house-emergent/Lewihouse/frontend/src/lib/mockData.js) default profile to `fauziealiakhmad@gmail.com`.
