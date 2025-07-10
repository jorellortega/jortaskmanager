# Cycle Tracking Feature Setup

## Overview
The Cycle Tracking feature has been added to the Weekly Task Manager app. This feature allows users to track their menstrual cycles, log symptoms, and predict future periods.

## Database Setup

### 1. Run the SQL Script
Execute the `cycle_tracking_tables.sql` file in your Supabase SQL editor to create the necessary tables:

```sql
-- This will create:
-- 1. cycle_entries table for period tracking
-- 2. symptom_logs table for daily symptom tracking
-- 3. Row Level Security (RLS) policies
-- 4. Indexes for performance
-- 5. Triggers for updated_at timestamps
```

### 2. Tables Created

#### cycle_entries
- `id`: UUID primary key
- `user_id`: References auth.users(id)
- `start_date`: Date when period started
- `end_date`: Date when period ended (optional)
- `flow_intensity`: 'light', 'medium', or 'heavy'
- `symptoms`: Array of symptoms experienced
- `notes`: Additional notes
- `created_at` and `updated_at`: Timestamps

#### symptom_logs
- `id`: UUID primary key
- `user_id`: References auth.users(id)
- `date`: Date of symptom log
- `symptoms`: Array of symptoms
- `mood`: User's mood on that day
- `notes`: Additional notes
- `created_at` and `updated_at`: Timestamps

## Features

### 1. Calendar View
- Visual calendar showing period start dates, symptom logs, and predicted periods
- Color-coded indicators:
  - Red: Period start date
  - Pink: Symptom log date
  - Purple: Predicted next period

### 2. Cycle History
- View all past cycle entries
- See flow intensity, symptoms, and notes
- Calculate average cycle length

### 3. Symptom Tracking
- Log daily symptoms and mood
- Track common symptoms like cramps, bloating, fatigue, etc.
- Add custom notes

### 4. Predictions
- Automatically calculate average cycle length
- Predict next period based on historical data
- Display prediction on calendar

### 5. Statistics
- Total cycles tracked
- Average cycle length
- Next predicted period date

## Navigation
The Cycle Tracking page is accessible via:
- Top navigation bar (Heart icon)
- Direct URL: `/cycle-tracking`

## Privacy & Security
- All data is protected with Row Level Security (RLS)
- Users can only access their own data
- Data is automatically deleted when user account is deleted

## Usage Instructions

### Adding a Cycle Entry
1. Go to the "Add Entry" tab
2. Select start date (required)
3. Optionally add end date
4. Choose flow intensity
5. Select symptoms from the checklist
6. Add any notes
7. Click "Add Cycle Entry"

### Adding a Symptom Log
1. Go to the "Add Entry" tab
2. Select the date
3. Choose your mood
4. Select symptoms from the checklist
5. Add any notes
6. Click "Add Symptom Log"

### Viewing Data
- **Calendar Tab**: Visual overview of all cycle data
- **Cycles Tab**: List of all cycle entries
- **Symptoms Tab**: List of all symptom logs

## Integration
The Cycle Tracking feature integrates with:
- Calendar system for date-based tracking
- User authentication for data privacy
- Existing app design patterns and UI components

## Future Enhancements
Potential future features:
- Fertility tracking
- Birth control reminder
- Integration with health apps
- Export data functionality
- Advanced analytics and insights 