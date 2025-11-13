"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight, Home, CreditCard } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { supabase } from '@/lib/supabaseClient'

export default function PaymentSuccessPage() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()

  useEffect(() => {
    const sessionIdParam = searchParams.get('session_id')
    if (sessionIdParam) {
      setSessionId(sessionIdParam)
    }
    setLoading(false)
    
    // Automatically update subscription when page loads
    updateSubscription()
  }, [searchParams])

  const updateSubscription = async () => {
    try {
      console.log('🔄 Updating subscription after successful payment...')
      
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ No authenticated user:', authError)
        return
      }
      
      console.log('👤 Current user:', user.id)
      
      // Use the manual update API route
      const response = await fetch('/api/manual-update-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          stripeCustomerId: 'temp_customer_' + user.id,
          stripeSubscriptionId: 'temp_sub_' + user.id,
          priceId: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID || 'price_1SLZFu5galpigtlqXxg69aIS'
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ Error updating subscription:', result.error)
      } else {
        console.log('✅ Subscription updated to Basic plan!')
      }
    } catch (err) {
      console.error('❌ Error in updateSubscription:', err)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Processing payment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white flex items-center justify-center">
      <Card className="w-full max-w-md bg-[#141415] border border-gray-700">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-green-400">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-gray-400 mb-4">
              Thank you for your purchase! Your payment has been processed successfully.
            </p>
            {sessionId && (
              <p className="text-sm text-gray-500">
                Session ID: {sessionId}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Link href="/credits">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <CreditCard className="mr-2 h-4 w-4" />
                View Credits
              </Button>
            </Link>
            
            <Link href="/billing">
              <Button variant="outline" className="w-full">
                <ArrowRight className="mr-2 h-4 w-4" />
                Billing Dashboard
              </Button>
            </Link>
            
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>

          <div className="bg-green-900/20 border border-green-500 p-4 rounded">
            <h3 className="font-semibold text-green-400 mb-2">What's Next?</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Your credits have been added to your account</li>
              <li>• You can start using the API immediately</li>
              <li>• Check your billing dashboard for transaction details</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
