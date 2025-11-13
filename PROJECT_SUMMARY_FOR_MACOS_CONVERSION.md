# Project Summary: Weekly Task Manager - macOS Conversion Guide

## Project Overview

**Weekly Task Manager by JOR** is a comprehensive productivity web application built with Next.js that helps users organize their entire life in one place. It's a multi-feature task management system with calendar integration, goal tracking, meal planning, fitness tracking, expense management, peer collaboration, and much more.

**Current Status:** Web application (Next.js 15.2.4) deployed on Vercel  
**Target Platform:** macOS Native Application

---

## Technology Stack

### Core Framework
- **Next.js**: 15.2.4 (React 18.2.0 framework)
- **React**: 18.2.0
- **TypeScript**: 5.x
- **Node.js**: Required for build process

### Database & Backend
- **Supabase**: PostgreSQL database with real-time capabilities
  - Authentication (Supabase Auth)
  - Row Level Security (RLS) policies
  - Real-time subscriptions
  - Serverless functions (via API routes)

### Payment Processing
- **Stripe**: Full payment integration
  - Subscription management
  - One-time payments (credits)
  - Webhook handling
  - Customer portal

### UI Framework
- **Tailwind CSS**: 3.4.17 for styling
- **Radix UI**: Comprehensive component library (50+ components)
- **Lucide React**: Icon library
- **Shadcn/ui**: Component system (built on Radix UI)
- **next-themes**: Theme management

### Key Libraries
- **date-fns**: Date manipulation and formatting
- **react-hook-form**: Form handling
- **zod**: Schema validation
- **recharts**: Data visualization/charts
- **react-qr-code**: QR code generation (for peer sync)
- **sonner**: Toast notifications

---

## Project Architecture

### File Structure
```
/app                    # Next.js App Router pages
  /api                  # API routes (Next.js API routes)
    /credits            # Credit purchase/usage endpoints
    /stripe             # Stripe payment endpoints
  /auth                 # Authentication page
  /dashboard            # Main dashboard
  /calendar             # Calendar view
  /appointments         # Appointment management
  /todo                 # Task management
  /goals                # Goal tracking
  /fitness              # Fitness tracking
  /meal-planning        # Meal planning
  /expenses             # Expense tracking
  /billing              # Subscription management
  /credits              # Credit management
  /peersync             # Peer collaboration
  ... (30+ feature pages)

/components             # React components
  /ui                   # 50+ reusable UI components (Radix-based)
  TopNavBar.tsx         # Main navigation component
  TopNavBarWrapper.tsx  # Navigation wrapper

/lib                    # Utilities
  supabaseClient.ts     # Supabase client initialization
  utils.ts              # Helper functions

/public                 # Static assets
  placeholder-*.png    # Images/logos
```

### Routing System
- Uses Next.js 13+ App Router (file-based routing)
- Client-side navigation with `next/link`
- Dynamic routes supported
- API routes at `/api/*`

### Authentication Flow
1. User signs up/logs in via Supabase Auth (`/auth`)
2. Session stored in browser (Supabase handles)
3. Protected routes check auth state
4. User metadata stored in Supabase Auth
5. Navigation items customized per user

---

## Core Features & Modules

### 1. **Dashboard** (`/dashboard`)
- Weekly task overview
- Calendar integration
- Quick access to all features
- Activity feed
- Progress tracking

### 2. **Calendar & Scheduling**
- **Calendar** (`/calendar`): Full calendar view
- **Appointments** (`/appointments`): Appointment management
- **Week View** (`/week`): Weekly planning interface

### 3. **Task Management**
- **Todo** (`/todo`): Task lists with subtasks
- **Weekly Tasks** (`/dashboard`): Weekly recurring tasks
- **Goals** (`/goals`): Goal setting and tracking

### 4. **Productivity Tools**
- **Work** (`/work`): Work-related tasks
- **Business** (`/business`): Business management
- **Work Clock** (`/work-clock`): Time tracking
- **Notes** (`/notes`): Note-taking
- **Journal** (`/journal`): Journaling
- **Brainstorming** (`/brainstorming`): Idea management

### 5. **Lifestyle Features**
- **Meal Planning** (`/meal-planning`): Meal organization
- **Fitness** (`/fitness`): Workout tracking with subtasks
- **Leisure** (`/leisure`): Leisure activity tracking
- **Travel** (`/travel`): Travel planning
- **Routines** (`/routines`): Daily routine building

### 6. **Health & Wellness**
- **Cycle Tracking** (`/cycle-tracking`): Menstrual cycle tracking
- **Pregnancy** (`/pregnancy`): Pregnancy tracking
- **Wedding** (`/wedding`): Wedding planning
- **Baby Shower** (`/baby-shower`): Baby shower planning

### 7. **Social & Collaboration**
- **Peer Sync** (`/peersync`): Sync with friends/peers
- **Synced Peers** (`/syncedpeers`): Manage peer connections
- **Peer Settings** (`/peersettings`): Configure peer sync
- **Time Sync** (`/time-sync`): Synchronize time with peers

### 8. **Finance**
- **Expenses** (`/expenses`): Expense tracking
- **Billing** (`/billing`): Subscription management
- **Credits** (`/credits`): Credit system dashboard
- **Pricing** (`/pricing`): Pricing page

### 9. **Settings & Customization**
- **Settings** (`/settings`): General settings
- **Nav Customization** (`/nav-customization`): Customize navigation bar
- **Account** (`/account`): Account management

### 10. **Self Development**
- **Self Development** (`/selfdevelopment`): Personal growth tracking

---

## Database Schema

### Core Tables (Supabase PostgreSQL)

#### User & Authentication
- `auth.users` (Supabase Auth - managed)
- User metadata stored in `auth.users.user_metadata`

#### Tasks & Activities
- `weekly_tasks`: Core weekly task management
- `todos`: Task lists with parent-child relationships
- `goals`: Goal tracking
- `appointments`: Appointment scheduling
- `fitness_activities`: Fitness tracking with subtasks
- `leisure_activities`: Leisure activity tracking
- `work_priorities`: Work task management

#### Specialized Features
- `cycle_tracking`: Menstrual cycle data
- `pregnancy_info`, `pregnancy_symptoms`, `pregnancy_appointments`, `pregnancy_milestones`
- `wedding_info`, `wedding_vendors`, `wedding_tasks`, `wedding_guests`
- `baby_shower_info`, `baby_shower_guests`, `baby_shower_gifts`, `baby_shower_food`, `baby_shower_decorations`
- `meal_planning`: Meal planning data
- `expenses`: Financial tracking
- `activity_participants`: Multi-user activity participation

#### Peer Sync
- `peers`: Peer connections (pending/accepted/rejected/blocked)
- `peer_sync_preferences`: User preferences for what to sync
- `peer_sync_data`: Shared data between peers

#### Subscriptions & Credits
- `user_subscriptions`: Stripe subscription data
  - Fields: `stripe_customer_id`, `stripe_subscription_id`, `plan_name`, `plan_type`, `subscription_status`, `billing_cycle`
- `user_credits`: Credit balance tracking
- `credit_transactions`: Credit purchase/usage history
- `payment_history`: Payment records
- `api_usage`: API call tracking

#### Customization
- `quick_add_buttons`: Custom quick action buttons
- Navigation preferences stored in user metadata

### Database Features
- **Row Level Security (RLS)**: All tables have RLS policies
- **Triggers**: Auto-update timestamps, credit management
- **Functions**: Credit management (`add_user_credits`, `deduct_user_credits`, `has_active_subscription`)
- **Indexes**: Performance optimization on user_id, dates, categories

### SQL Files (Reference)
- `weekly_tasks_table.sql`
- `user_subscriptions.sql`
- `credits_functions.sql`
- `peer_sync_tables.sql`
- `cycle_tracking_tables.sql`
- `pregnancy_tracking_tables.sql`
- `wedding_planning_tables.sql`
- `baby_shower_tables.sql`
- `meal_planning_updates.sql`
- `fitness_activities_subtasks.sql`
- `leisure_activities_subtasks.sql`
- `work_priorities_subtasks.sql`
- `self_development_subtasks.sql`
- `activity_participants_table.sql`
- `quick_add_buttons_table.sql`

---

## API Endpoints

### Authentication
- Handled by Supabase Auth (client-side)
- No custom auth endpoints

### Payment & Subscriptions
- `POST /api/stripe/create-checkout-session`: Create Stripe checkout
- `POST /api/stripe/create-portal-session`: Access Stripe customer portal
- `POST /api/stripe/webhook`: Stripe webhook handler (server-side)
- `POST /api/manual-update-subscription`: Manual subscription update

### Credits System
- `POST /api/credits/purchase`: Purchase credits
- `POST /api/credits/use`: Deduct credits for API usage

### Data Operations
- All data operations use Supabase client directly (no custom API routes)
- Real-time subscriptions via Supabase Realtime

---

## Third-Party Integrations

### Supabase
- **URL**: `NEXT_PUBLIC_SUPABASE_URL`
- **Keys**: 
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client-side)
  - `SUPABASE_SERVICE_ROLE_KEY` (server-side, API routes only)
- **Features Used**:
  - Authentication (email/password)
  - PostgreSQL database
  - Row Level Security
  - Real-time subscriptions
  - Storage (if used)

### Stripe
- **Keys**:
  - `STRIPE_SECRET_KEY` (server-side)
  - `STRIPE_PUBLISHABLE_KEY` (client-side, if needed)
  - `STRIPE_WEBHOOK_SECRET` (webhook verification)
- **API Version**: 2024-12-18.acacia
- **Features Used**:
  - Subscription management
  - One-time payments
  - Webhooks
  - Customer portal

---

## Environment Variables

### Required Environment Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_or_live_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_or_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# App Configuration (for webhooks/redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or production URL
```

### Environment Variable Usage
- `NEXT_PUBLIC_*` variables are exposed to the client
- Server-side variables only available in API routes
- Client-side Supabase operations use `NEXT_PUBLIC_SUPABASE_*`
- Server-side operations use `SUPABASE_SERVICE_ROLE_KEY`

---

## Build & Deployment

### Current Build Process
```bash
npm install          # Install dependencies
npm run dev         # Development server (localhost:3000)
npm run build       # Production build
npm run start       # Production server
npm run lint        # Linting
```

### Build Configuration
- **Next.js Config**: `next.config.mjs`
  - TypeScript errors ignored during build
  - ESLint errors ignored during build
  - Images unoptimized
  - Experimental webpack build worker enabled

### Dependencies
- **Total Packages**: 60+ npm packages
- **Key Dependencies**: See `package.json`
- **Node Version**: Compatible with Node 18+

---

## Key Implementation Details

### State Management
- **React Hooks**: useState, useEffect, useCallback
- **Supabase Realtime**: Real-time data synchronization
- **Client-side State**: No Redux/Zustand (React state only)
- **Navigation State**: Stored in user metadata

### Styling Approach
- **Dark Theme**: Default dark theme (#0E0E0F background)
- **Tailwind CSS**: Utility-first CSS
- **Custom Colors**: Green accent colors (#22c55e)
- **Responsive**: Mobile-first design
- **Component Library**: Shadcn/ui components

### Navigation System
- **Top Navigation Bar**: Horizontal scrollable icon bar
- **Customizable**: Users can select which nav items to show
- **Categories**: Core, Productivity, Lifestyle, Social & Events, Health & Wellness, Finance, Development
- **Default Items**: Pre-selected default navigation items
- **Settings**: Always visible in navigation

### Credit System
- **Free Tier**: 100 free credits for new users
- **Usage**: Credits deducted per API call
- **Purchase**: Credit packages available
- **Tracking**: Full transaction history
- **Subscription Tiers**: Free, Basic, Premium, Enterprise

### Subscription System
- **Plans**: Basic ($3.25/month), Premium, Enterprise
- **Billing**: Monthly or Yearly
- **Stripe Integration**: Full Stripe Checkout flow
- **Customer Portal**: Self-service subscription management
- **Webhooks**: Automatic subscription updates

### Peer Sync Features
- **Connection System**: Send/receive peer connection requests
- **QR Codes**: Generate QR codes for peer connections
- **Data Sharing**: Sync specific categories (calendar, fitness, etc.)
- **Privacy**: Granular control over what to share
- **Real-time**: Updates sync in real-time

---

## Important Considerations for macOS Conversion

### 1. **Web-to-Native Bridge**
- **Option A**: Electron (wraps web app in native shell)
- **Option B**: React Native for macOS (rewrite components)
- **Option C**: Tauri (lightweight alternative to Electron)
- **Option D**: Native macOS (Swift/SwiftUI) with API layer

### 2. **API Routes Conversion**
- Next.js API routes (`/api/*`) need to be converted:
  - **Option 1**: Keep as separate backend service (Node.js/Express)
  - **Option 2**: Move to Supabase Edge Functions
  - **Option 3**: Implement in native macOS app (if possible)

### 3. **Stripe Webhook Handling**
- Webhooks currently require public URL (`/api/stripe/webhook`)
- **Solution**: Keep webhook endpoint on backend service or use Stripe CLI for development
- Production webhooks must be accessible from Stripe servers

### 4. **Authentication**
- Supabase Auth works client-side (should work in desktop app)
- Session management may need adjustment for desktop
- Token storage: Secure storage instead of browser cookies

### 5. **File System Access**
- Web app has limited file system access
- macOS app can leverage native file system
- Consider: Export/import functionality, local caching, offline support

### 6. **Offline Capabilities**
- Current app requires internet connection
- Consider: Local SQLite database for offline mode
- Sync mechanism when online

### 7. **Navigation**
- Current: Browser-based routing (`next/link`, `useRouter`)
- macOS: Native navigation (window management, tab groups)
- Consider: Native menu bar, keyboard shortcuts

### 8. **Real-time Features**
- Supabase Realtime works in desktop apps
- WebSocket connections should work similarly
- Test connection management in desktop context

### 9. **UI Components**
- Radix UI components are web-focused
- **Option A**: Use Electron and keep web components
- **Option B**: Find macOS-native equivalents
- **Option C**: Custom native components

### 10. **Notifications**
- Web: Browser notifications
- macOS: Native notifications (NSUserNotification)
- Calendar integration: macOS Calendar.app integration?

### 11. **Data Storage**
- Current: Supabase (cloud database)
- macOS: Consider local caching, preferences storage
- User data: Continue using Supabase or add local database

### 12. **Build & Distribution**
- **Code Signing**: Required for macOS distribution
- **Notarization**: Required for Gatekeeper
- **App Store**: Consider Mac App Store vs. direct distribution
- **Updates**: Auto-update mechanism

### 13. **Performance**
- Bundle size: Current web app may be large
- Startup time: Native apps should be faster
- Memory usage: Monitor with Electron/desktop wrapper

### 14. **Platform-Specific Features**
- **Menu Bar**: macOS menu bar integration
- **Touch Bar**: MacBook Pro Touch Bar support (if applicable)
- **Drag & Drop**: Native macOS drag & drop
- **Keyboard Shortcuts**: macOS standard shortcuts
- **Spotlight Integration**: Search integration
- **Widgets**: macOS widgets (if desired)

---

## Recommended Approach for macOS Conversion

### Phase 1: Architecture Decision
1. Choose framework: **Electron** (easiest) or **Tauri** (lighter) or **Native** (best UX)
2. Set up project structure
3. Configure build tools

### Phase 2: Core Migration
1. Migrate React components (should work with minimal changes)
2. Convert Next.js routing to desktop navigation
3. Set up Supabase client in desktop context
4. Handle authentication flow

### Phase 3: API & Backend
1. Convert API routes to backend service OR Supabase Edge Functions
2. Set up webhook endpoint (must remain accessible)
3. Test Stripe integration in desktop context
4. Handle CORS if backend is separate

### Phase 4: Native Features
1. Implement macOS-specific UI elements
2. Add native notifications
3. File system integration
4. Menu bar integration
5. Keyboard shortcuts

### Phase 5: Testing & Optimization
1. Test all features
2. Performance optimization
3. Memory leak testing
4. Offline mode testing
5. Update mechanism

### Phase 6: Distribution
1. Code signing setup
2. Notarization process
3. App Store submission (if applicable)
4. Distribution channel setup

---

## Technical Contact Points

### Critical Files to Review
- `lib/supabaseClient.ts`: Supabase initialization
- `app/api/stripe/webhook/route.ts`: Webhook handling logic
- `components/TopNavBar.tsx`: Navigation system
- `app/dashboard/page.tsx`: Main dashboard logic
- `app/auth/page.tsx`: Authentication flow

### Database Queries
- All SQL files in root directory for schema reference
- RLS policies must be maintained
- Trigger functions must be preserved

### Configuration Files
- `package.json`: All dependencies
- `next.config.mjs`: Build configuration
- `tailwind.config.ts`: Styling configuration
- `tsconfig.json`: TypeScript configuration

---

## Questions to Resolve

1. **Offline Mode**: Should the app work offline? If yes, local database strategy?
2. **Backend**: Keep API routes as separate service or move to Supabase Edge Functions?
3. **Distribution**: App Store or direct distribution?
4. **Updates**: Auto-update mechanism preference?
5. **Features**: Any macOS-specific features to add?
6. **Performance**: Target bundle size and memory usage?
7. **Testing**: Testing strategy for macOS app?

---

## Additional Resources

### Documentation
- `STRIPE_SETUP.md`: Stripe integration details
- `CYCLE_TRACKING_SETUP.md`: Cycle tracking feature documentation
- SQL files: Database schema reference

### External Dependencies
- Supabase Documentation: https://supabase.com/docs
- Stripe Documentation: https://stripe.com/docs
- Next.js Documentation: https://nextjs.org/docs
- Radix UI: https://www.radix-ui.com

---

## Summary

This is a **comprehensive productivity web application** with:
- **30+ feature modules**
- **Full authentication system** (Supabase)
- **Payment processing** (Stripe subscriptions + credits)
- **Real-time collaboration** (peer sync)
- **Complex database schema** (20+ tables)
- **Modern React/Next.js architecture**
- **Rich UI component library**

**Conversion Complexity**: Medium to High
- Most React components can be reused
- API routes need backend service
- Navigation needs desktop adaptation
- Native features can enhance UX

**Estimated Effort**: 4-8 weeks for experienced developer (depending on chosen approach)

---

*Last Updated: Based on current codebase analysis*  
*Project: Weekly Task Manager by JOR*  
*Version: 0.1.0*


