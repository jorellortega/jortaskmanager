"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, DollarSign, Zap, Check, Star } from "lucide-react"
import Link from "next/link"
import { supabase } from '@/lib/supabaseClient'

interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  bonus: number;
  popular?: boolean;
  description: string;
}

const creditPackages: CreditPackage[] = [
  {
    id: 'starter',
    credits: 100,
    price: 1,
    bonus: 0,
    description: 'Perfect for testing and small projects'
  },
  {
    id: 'basic',
    credits: 500,
    price: 4,
    bonus: 50,
    description: 'Great for regular API usage'
  },
  {
    id: 'popular',
    credits: 1000,
    price: 7,
    bonus: 200,
    description: 'Most popular choice for developers',
    popular: true
  },
  {
    id: 'professional',
    credits: 2500,
    price: 15,
    bonus: 750,
    description: 'For professional applications'
  },
  {
    id: 'enterprise',
    credits: 5000,
    price: 25,
    bonus: 2500,
    description: 'For high-volume applications'
  }
]

export default function CreditsPurchasePage() {
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentCredits, setCurrentCredits] = useState<number>(0)

  useEffect(() => {
    fetchCurrentCredits()
  }, [])

  const fetchCurrentCredits = async () => {
    try {
      console.log('🔍 Fetching current credits...')
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('👤 User in purchase:', user?.id, 'Auth error:', authError)
      if (authError || !user) return

      console.log('💰 Fetching credits balance for purchase page...')
      const { data: creditsData, error: creditsError } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', user.id)

      console.log('💳 Purchase page credits data:', creditsData, 'Credits error:', creditsError)
      if (!creditsError && creditsData && creditsData.length > 0) {
        setCurrentCredits(creditsData[0].balance)
      } else if (!creditsError && (!creditsData || creditsData.length === 0)) {
        // User has no credits record yet, create one with default values
        console.log('👤 No credits record found in purchase page, creating default record...')
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
        
        console.log('🆕 New credits record in purchase:', newCredits, 'Insert error:', insertError)
        if (!insertError && newCredits) {
          setCurrentCredits(newCredits.balance)
        }
      }
    } catch (error) {
      console.error('❌ Error fetching current credits:', error)
    }
  }

  const handlePurchase = async (packageData: CreditPackage) => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Please log in to purchase credits')
        return
      }

      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          credits: packageData.credits + packageData.bonus,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create checkout session')
        return
      }

      // Redirect to Stripe Checkout
      window.location.href = `/payment/success?session_id=${data.sessionId}`
    } catch (error) {
      console.error('Error purchasing credits:', error)
      setError('Failed to process purchase')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  return (
    <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Purchase API Credits</h1>
        <Link href="/credits" className="flex items-center text-blue-500 hover:text-blue-400">
          <ArrowLeft className="mr-2" />
          Back to Credits
        </Link>
      </div>

      {error && (
        <Card className="bg-red-900/20 border-red-500 mb-4">
          <CardContent className="p-4">
            <p className="text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Current Balance */}
      <Card className="bg-[#141415] border border-gray-700 mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-6 w-6 text-green-400" />
              <div>
                <div className="text-sm text-gray-400">Current Balance</div>
                <div className="text-2xl font-bold text-green-400">{currentCredits}</div>
              </div>
            </div>
            <Badge variant="outline" className="text-green-400">
              Credits Available
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Credit Packages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {creditPackages.map((packageData) => (
          <Card 
            key={packageData.id} 
            className={`bg-[#141415] border border-gray-700 relative cursor-pointer transition-all hover:border-blue-500 ${
              selectedPackage?.id === packageData.id ? 'ring-2 ring-blue-500' : ''
            } ${packageData.popular ? 'ring-2 ring-green-500' : ''}`}
            onClick={() => setSelectedPackage(packageData)}
          >
            {packageData.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-green-500 text-white px-3 py-1">
                  <Star className="h-3 w-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center">
              <CardTitle className="text-xl text-white">{packageData.credits.toLocaleString()} Credits</CardTitle>
              <div className="text-3xl font-bold text-blue-400">
                {formatPrice(packageData.price)}
              </div>
              {packageData.bonus > 0 && (
                <Badge className="bg-green-600 text-white">
                  +{packageData.bonus} Bonus Credits
                </Badge>
              )}
              <p className="text-gray-400 text-sm">{packageData.description}</p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-200">
                    {packageData.credits + packageData.bonus} Total Credits
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-200">
                    ${(packageData.price / (packageData.credits + packageData.bonus)).toFixed(4)} per credit
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-200">
                    Instant activation
                  </span>
                </div>
              </div>
              
              <Button 
                onClick={() => handlePurchase(packageData)}
                disabled={loading}
                className={`w-full ${
                  packageData.popular ? 'bg-green-600 hover:bg-green-700' : ''
                }`}
              >
                {loading ? 'Processing...' : 'Purchase Credits'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pricing Information */}
      <Card className="bg-[#141415] border border-gray-700 mt-8">
        <CardHeader>
          <CardTitle className="text-center text-purple-400">Credit Usage Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <Zap className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <h3 className="font-semibold mb-2">API Calls</h3>
              <p className="text-sm text-gray-400">
                Each API call typically costs 1 credit, with some advanced features costing more.
              </p>
            </div>
            <div>
              <DollarSign className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <h3 className="font-semibold mb-2">No Expiration</h3>
              <p className="text-sm text-gray-400">
                Credits never expire, so you can use them whenever you need them.
              </p>
            </div>
            <div>
              <Check className="h-8 w-8 text-purple-400 mx-auto mb-2" />
              <h3 className="font-semibold mb-2">Instant Access</h3>
              <p className="text-sm text-gray-400">
                Credits are added to your account immediately after payment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
