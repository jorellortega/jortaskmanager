"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Check, Star, Zap } from "lucide-react"
import Link from "next/link"
import { supabase } from '@/lib/supabaseClient'

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  credits: number;
  popular?: boolean;
  stripePriceId: string;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started',
    price: 0,
    billingCycle: 'monthly',
    features: [
      'Up to 10 tasks per week',
      'Basic calendar view',
      'Limited API calls (100/month)',
      'Community support'
    ],
    credits: 100,
    stripePriceId: ''
  },
  {
    id: 'basic',
    name: 'Basic',
    description: 'For individuals and small teams',
    price: 3.25,
    billingCycle: 'monthly',
    features: [
      'Unlimited tasks',
      'Advanced calendar features',
      'API access (1,000 calls/month)',
      'Priority support',
      'Custom categories',
      'Export data'
    ],
    credits: 1000,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID || 'price_1SLZFH6jTRzt8LDZNEOT6oFB'
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'For power users and growing teams',
    price: 19,
    billingCycle: 'monthly',
    features: [
      'Everything in Basic',
      'Advanced analytics',
      'API access (5,000 calls/month)',
      'Team collaboration',
      'Advanced integrations',
      'Custom workflows',
      'Priority support'
    ],
    credits: 5000,
    popular: true,
    stripePriceId: 'price_premium_monthly'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    price: 49,
    billingCycle: 'monthly',
    features: [
      'Everything in Premium',
      'Unlimited API calls',
      'Custom integrations',
      'Dedicated support',
      'Advanced security',
      'Custom branding',
      'SLA guarantee'
    ],
    credits: 50000,
    stripePriceId: 'price_enterprise_monthly'
  }
]

export default function PricingPlansPage() {
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    checkAuthAndFetchPlan()
  }, [])

  const checkAuthAndFetchPlan = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      setIsAuthenticated(!!user && !authError)
      if (user && !authError) {
        await fetchCurrentPlan()
      }
    } catch (error) {
      console.error('Error checking auth:', error)
      setIsAuthenticated(false)
    } finally {
      setCheckingAuth(false)
    }
  }

  const fetchCurrentPlan = async () => {
    try {
      console.log('🔍 Fetching current plan...')
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('👤 User for plan fetch:', user?.id, 'Auth error:', authError)
      if (authError || !user) return

      console.log('📊 Fetching subscription data...')
      const { data: subscriptionData, error: subError } = await supabase
        .from('user_subscriptions')
        .select('plan_type, subscription_status')
        .eq('user_id', user.id)

      console.log('📋 Subscription data:', subscriptionData, 'Error:', subError)
      if (!subError && subscriptionData && subscriptionData.length > 0) {
        console.log('✅ Current plan:', subscriptionData[0].plan_type)
        setCurrentPlan(subscriptionData[0].plan_type)
      } else {
        console.log('❌ No subscription found')
      }
    } catch (error) {
      console.error('Error fetching current plan:', error)
    }
  }

  const handleSubscribe = async (plan: Plan) => {
    console.log('🖱️ Subscribe button clicked for plan:', plan.id, plan.name)
    
    // Check authentication first
    if (!isAuthenticated) {
      setError('Please log in to subscribe to a plan')
      // Redirect to auth page after a short delay
      setTimeout(() => {
        window.location.href = '/auth'
      }, 2000)
      return
    }
    
    if (plan.id === 'free') {
      console.log('❌ Free plan clicked - showing error')
      setError('You are already on the free plan')
      return
    }

    // Validate price ID
    if (!plan.stripePriceId || plan.stripePriceId.trim() === '') {
      setError(`Price ID not configured for ${plan.name} plan. Please contact support.`)
      return
    }

    try {
      console.log('🔄 Starting subscription process for plan:', plan.name)
      setLoading(true)
      setError(null)
      
      const { data: { user } } = await supabase.auth.getUser()
      console.log('👤 User for subscription:', user?.id)
      if (!user) {
        setError('Please log in to subscribe')
        setIsAuthenticated(false)
        return
      }

      console.log('💳 Creating checkout session with price ID:', plan.stripePriceId)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session?.access_token) {
        setError('Authentication error. Please log in again.')
        setIsAuthenticated(false)
        return
      }
      
      console.log('📡 Making API call to create checkout session...')
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          type: 'subscription',
          priceId: plan.stripePriceId,
        }),
      })

      console.log('📡 Checkout response status:', response.status)
      
      const data = await response.json()
      console.log('📄 Checkout response data:', data)

      if (!response.ok) {
        console.log('❌ Checkout failed:', data.error)
        setError(data.error || 'Failed to create checkout session. Please try again.')
        return
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        console.log('🚀 Redirecting to Stripe Checkout URL:', data.url)
        window.location.href = data.url
      } else if (data.sessionId) {
        console.log('🚀 Redirecting to Stripe Checkout with session:', data.sessionId)
        window.location.href = `/checkout?session_id=${data.sessionId}`
      } else {
        setError('Invalid response from server. Please try again.')
      }
    } catch (error: any) {
      console.error('Error creating subscription:', error)
      setError(error.message || 'Failed to create subscription. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading plans...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Choose Your Plan</h1>
        <Link href="/billing" className="flex items-center text-blue-500 hover:text-blue-400">
          <ArrowLeft className="mr-2" />
          Back to Billing
        </Link>
      </div>

      {/* Authentication Notice */}
      {!isAuthenticated && (
        <Card className="bg-yellow-900/20 border-yellow-500 mb-6">
          <CardContent className="p-4">
            <p className="text-yellow-400 mb-2">
              Please <Link href="/auth" className="underline font-semibold">log in</Link> to subscribe to a plan.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Current Plan Display */}
      {currentPlan && (
        <Card className="bg-blue-900/20 border-blue-500 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="bg-blue-500 rounded-full p-2 mr-3">
                <Check className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-blue-400 font-medium">Current Plan</p>
                <p className="text-white text-lg capitalize">{currentPlan} Plan</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="bg-red-900/20 border-red-500 mb-4">
          <CardContent className="p-4">
            <p className="text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`bg-[#141415] border border-gray-700 relative ${
              plan.popular ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-white px-3 py-1">
                  <Star className="h-3 w-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center">
              <CardTitle className="text-xl text-white">{plan.name}</CardTitle>
              <div className="text-3xl font-bold text-blue-400">
                ${plan.price}
                <span className="text-sm text-gray-400">/month</span>
              </div>
              <p className="text-gray-400 text-sm">{plan.description}</p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-200">{feature}</span>
                  </div>
                ))}
              </div>
              
              <div className="pt-4 border-t border-gray-700">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-400 mb-3">
                  <Zap className="h-4 w-4" />
                  <span>{plan.credits.toLocaleString()} API Credits</span>
                </div>
                
                {currentPlan === plan.id ? (
                  <Button className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : plan.id === 'free' ? (
                  <Button 
                    onClick={() => {
                      if (!isAuthenticated) {
                        window.location.href = '/auth'
                      }
                    }}
                    className="w-full"
                    variant="outline"
                  >
                    Get Started
                  </Button>
                ) : (
                  <Button 
                    onClick={() => {
                      console.log('🖱️ BUTTON CLICKED!', plan.id, plan.name)
                      handleSubscribe(plan)
                    }}
                    disabled={loading || !isAuthenticated || !plan.stripePriceId}
                    className={`w-full ${
                      plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''
                    }`}
                  >
                    {loading ? 'Processing...' : plan.price === 0 ? 'Get Started' : 'Subscribe'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Credits Purchase Section */}
      <Card className="bg-[#141415] border border-gray-700 mt-8">
        <CardHeader>
          <CardTitle className="text-center text-green-400">Need More API Credits?</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-400 mb-4">
            Purchase additional API credits to use with any plan
          </p>
          <Link href="/credits/purchase">
            <Button className="bg-green-600 hover:bg-green-700">
              Buy Credits
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
