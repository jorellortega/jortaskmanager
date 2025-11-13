# Stripe Integration Setup Guide

This guide will help you set up Stripe integration for your weekly task manager application.

## Prerequisites

1. Stripe account (create at https://stripe.com)
2. Supabase project with database access
3. Environment variables configured

## Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Database Setup

1. Run the following SQL files in your Supabase SQL editor:
   - `user_subscriptions.sql`
   - `credits_functions.sql`

2. These will create:
   - User subscriptions table
   - User credits table
   - Credit transactions table
   - Payment history table
   - API usage table
   - Helper functions for credit management

## Stripe Configuration

### 1. Create Products and Prices

In your Stripe Dashboard, create the following products and prices:

**Subscription Plans:**
- Basic Monthly: $9/month
- Basic Yearly: $90/year
- Premium Monthly: $19/month
- Premium Yearly: $190/year
- Enterprise Monthly: $49/month
- Enterprise Yearly: $490/year

**Credit Packages:**
- 100 Credits: $1
- 500 Credits: $4
- 1000 Credits: $7
- 2500 Credits: $15
- 5000 Credits: $25

### 2. Update Price IDs

Update the price IDs in the following files:
- `app/billing/plans/page.tsx` - Update the `stripePriceId` values
- `app/api/stripe/webhook/route.ts` - Update the price mapping functions

### 3. Configure Webhooks

1. Go to Stripe Dashboard > Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook secret to your environment variables

## Features Implemented

### 1. Subscription Management
- **Billing Dashboard** (`/billing`): View subscription status, billing history
- **Pricing Plans** (`/billing/plans`): Choose subscription tiers
- **Customer Portal**: Manage subscriptions through Stripe

### 2. Credits System
- **Credits Dashboard** (`/credits`): View balance, usage, transactions
- **Purchase Credits** (`/credits/purchase`): Buy credit packages
- **Usage Tracking**: Monitor API usage and credit consumption

### 3. Payment Processing
- **Stripe Checkout**: Secure payment processing
- **Success/Cancel Pages**: Handle payment outcomes
- **Webhook Handling**: Process Stripe events automatically

### 4. Free Tier Support
- New users get 100 free credits
- Usage limits based on subscription tier
- Graceful degradation for free users

## API Usage

### Credit Deduction
```typescript
// Before making API calls, check and deduct credits
const response = await fetch('/api/credits/use', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    endpoint: '/api/your-endpoint',
    credits: 1,
    requestData: { /* your data */ }
  })
});
```

### Subscription Check
```typescript
// Check if user has active subscription
const { data } = await supabase.rpc('has_active_subscription', {
  user_id: userId
});
```

## Testing

### Test Cards (Stripe Test Mode)
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires authentication: `4000 0025 0000 3155`

### Test Webhooks
Use Stripe CLI to test webhooks locally:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Security Considerations

1. **Environment Variables**: Never commit API keys to version control
2. **Webhook Verification**: Always verify webhook signatures
3. **RLS Policies**: Database access is protected by Row Level Security
4. **User Authentication**: All API routes require valid user authentication

## Monitoring

- Monitor failed payments in Stripe Dashboard
- Track credit usage in your database
- Set up alerts for low credit balances
- Monitor subscription cancellations

## Support

For issues with:
- **Stripe**: Check Stripe Dashboard logs and documentation
- **Database**: Verify RLS policies and function permissions
- **API**: Check server logs and network requests
- **Payments**: Verify webhook configuration and event handling
