"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CreditCard, DollarSign, Calendar, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { supabase } from '@/lib/supabaseClient'

interface Subscription {
  id: string;
  plan_name: string;
  plan_type: string;
  subscription_status: string;
  billing_cycle: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

interface Credits {
  balance: number;
  total_purchased: number;
  total_used: number;
}

interface PaymentHistory {
  id: string;
  amount: number;
  currency: string;
  payment_type: string;
  status: string;
  description: string;
  created_at: string;
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [credits, setCredits] = useState<Credits | null>(null)
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBillingData()
  }, [])

  const fetchBillingData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        setError("Please log in to view billing information")
        setLoading(false)
        return
      }

      // Fetch subscription data
      const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)

      if (!subError && subData && subData.length > 0) {
        setSubscription(subData[0])
      } else if (!subError && (!subData || subData.length === 0)) {
        // User has no subscription record yet, create a free one
        console.log('👤 No subscription record found, creating free subscription...')
        const { data: newSub, error: insertError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: user.id,
            stripe_customer_id: null,
            stripe_subscription_id: null,
            stripe_price_id: 'free_plan',
            subscription_status: 'active',
            plan_name: 'Free Plan',
            plan_type: 'free',
            billing_cycle: 'monthly',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          })
          .select()
          .single()
        
        console.log('🆕 New free subscription:', newSub, 'Insert error:', insertError)
        if (!insertError && newSub) {
          setSubscription(newSub)
        }
      }

      // Fetch credits data
      const { data: creditsData, error: creditsError } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)

      if (!creditsError && creditsData && creditsData.length > 0) {
        setCredits(creditsData[0])
      } else if (!creditsError && (!creditsData || creditsData.length === 0)) {
        // User has no credits record yet, create one with default values
        const { data: newCredits, error: insertError } = await supabase
          .from('user_credits')
          .insert({
            user_id: user.id,
            balance: 100,
            total_purchased: 100,
            total_used: 0
          })
          .select()
          .single()
        
        if (!insertError && newCredits) {
          setCredits(newCredits)
        }
      }

      // Fetch payment history
      const { data: paymentData, error: paymentError } = await supabase
        .from('payment_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!paymentError && paymentData) {
        setPaymentHistory(paymentData)
      }

    } catch (err) {
      console.error('Error fetching billing data:', err)
      setError("Failed to load billing information")
    } finally {
      setLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    try {
      console.log('🔄 Opening customer portal...')
      const { data: { user } } = await supabase.auth.getUser()
      console.log('👤 User for portal:', user?.id)
      if (!user) {
        console.log('❌ No user found')
        return
      }

      console.log('📡 Creating portal session...')
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      })

      console.log('📡 Portal response status:', response.status)
      const data = await response.json()
      console.log('📄 Portal response data:', data)
      
      if (data.url) {
        console.log('🚀 Redirecting to portal:', data.url)
        window.location.href = data.url
      } else if (data.redirect_to) {
        console.log('🔄 Redirecting to plans page for free user')
        window.location.href = data.redirect_to
      } else {
        console.log('❌ No portal URL received')
        setError(data.error || 'Failed to open customer portal')
      }
    } catch (error) {
      console.error('Error opening customer portal:', error)
      setError('Failed to open customer portal')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'canceled':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'past_due':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'canceled':
        return 'bg-red-100 text-red-800'
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading billing information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Billing & Subscription</h1>
        <Link href="/dashboard" className="flex items-center text-blue-500 hover:text-blue-400">
          <ArrowLeft className="mr-2" />
          Back to Dashboard
        </Link>
      </div>

      {error && (
        <Card className="bg-red-900/20 border-red-500 mb-4">
          <CardContent className="p-4">
            <p className="text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Status */}
        <Card className="bg-[#141415] border border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-400">
              <CreditCard className="mr-2 text-blue-400" />
              Subscription Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subscription ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-200">Plan:</span>
                  <span className="font-semibold">{subscription.plan_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-200">Status:</span>
                  <Badge className={getStatusColor(subscription.subscription_status)}>
                    {getStatusIcon(subscription.subscription_status)}
                    <span className="ml-1 capitalize">{subscription.subscription_status}</span>
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-200">Billing Cycle:</span>
                  <span className="capitalize">{subscription.billing_cycle}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-200">Next Billing:</span>
                  <span>{new Date(subscription.current_period_end).toLocaleDateString()}</span>
                </div>
                {subscription.cancel_at_period_end && (
                  <div className="bg-yellow-900/20 border border-yellow-500 p-3 rounded">
                    <p className="text-yellow-400 text-sm">
                      Your subscription will cancel at the end of the current period.
                    </p>
                  </div>
                )}
                <Button onClick={handleManageSubscription} className="w-full">
                  Manage Subscription
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-gray-400">No active subscription</p>
                <Link href="/billing/plans">
                  <Button className="w-full">View Plans</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Credits Balance */}
        <Card className="bg-[#141415] border border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-green-400">
              <DollarSign className="mr-2 text-green-400" />
              API Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            {credits ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">{credits.balance}</div>
                  <p className="text-gray-400">Available Credits</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Total Purchased:</span>
                    <div className="font-semibold">{credits.total_purchased}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Total Used:</span>
                    <div className="font-semibold">{credits.total_used}</div>
                  </div>
                </div>
                <Link href="/credits">
                  <Button className="w-full">Manage Credits</Button>
                </Link>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-gray-400">Loading credits...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card className="bg-[#141415] border border-gray-700 mt-6">
        <CardHeader>
          <CardTitle className="flex items-center text-purple-400">
            <Calendar className="mr-2 text-purple-400" />
            Recent Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paymentHistory.length > 0 ? (
            <div className="space-y-3">
              {paymentHistory.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-[#1A1A1B] rounded">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(payment.status)}
                    <div>
                      <div className="font-semibold">{payment.description}</div>
                      <div className="text-sm text-gray-400">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatAmount(payment.amount, payment.currency)}
                    </div>
                    <Badge className={getStatusColor(payment.status)}>
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">No payment history found</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
