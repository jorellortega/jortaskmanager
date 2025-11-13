"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

function CheckoutContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStripe = async () => {
      if (!sessionId) {
        setError('No session ID provided')
        setLoading(false)
        return
      }

      try {
        // Load Stripe.js
        console.log('🔑 Stripe publishable key:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
        const { loadStripe } = await import('@stripe/stripe-js')
        
        if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
          setError('Stripe publishable key is not configured')
          setLoading(false)
          return
        }
        
        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
        
        if (!stripe) {
          setError('Failed to load Stripe')
          setLoading(false)
          return
        }

         // Use Stripe.js redirectToCheckout method
         const result = await stripe.redirectToCheckout({
           sessionId: sessionId
         })

         if (result.error) {
           setError(result.error.message || 'Checkout failed')
           setLoading(false)
         }
      } catch (err) {
        console.error('Stripe checkout error:', err)
        setError('Failed to initialize checkout')
        setLoading(false)
      }
    }

    loadStripe()
  }, [sessionId])

  if (loading) {
    return (
      <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white flex items-center justify-center">
        <Card className="bg-[#141415] border border-gray-700">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <h2 className="text-xl font-semibold mb-2">Redirecting to Stripe Checkout...</h2>
            <p className="text-gray-400">Please wait while we redirect you to complete your payment.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white flex items-center justify-center">
        <Card className="bg-red-900/20 border-red-500">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2 text-red-400">Checkout Error</h2>
            <p className="text-red-300 mb-4">{error}</p>
            <Button 
              onClick={() => window.location.href = '/billing/plans'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Back to Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white flex items-center justify-center">
        <Card className="bg-[#141415] border border-gray-700">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          </CardContent>
        </Card>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
