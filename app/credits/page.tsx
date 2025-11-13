"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, DollarSign, TrendingUp, History, Zap } from "lucide-react"
import Link from "next/link"
import { supabase } from '@/lib/supabaseClient'

interface Credits {
  balance: number;
  total_purchased: number;
  total_used: number;
}

interface CreditTransaction {
  id: string;
  transaction_type: string;
  amount: number;
  description: string;
  created_at: string;
}

interface ApiUsage {
  id: string;
  endpoint: string;
  credits_used: number;
  created_at: string;
}

export default function CreditsPage() {
  const [credits, setCredits] = useState<Credits | null>(null)
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [apiUsage, setApiUsage] = useState<ApiUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCreditsData()
  }, [])

  const fetchCreditsData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Fetching credits data...')
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('👤 User:', user?.id, 'Auth error:', authError)
      
      if (authError || !user) {
        setError("Please log in to view credits")
        setLoading(false)
        return
      }

      // Fetch credits balance
      console.log('💰 Fetching user credits for user:', user.id)
      const { data: creditsData, error: creditsError } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)

      console.log('💳 Credits data:', creditsData, 'Credits error:', creditsError)
      if (!creditsError && creditsData && creditsData.length > 0) {
        setCredits(creditsData[0])
      } else if (!creditsError && (!creditsData || creditsData.length === 0)) {
        // User has no credits record yet, create one with default values
        console.log('👤 No credits record found, creating default record...')
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
        
        console.log('🆕 New credits record:', newCredits, 'Insert error:', insertError)
        if (!insertError && newCredits) {
          setCredits(newCredits)
        }
      }

      // Fetch credit transactions
      console.log('📊 Fetching credit transactions...')
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      console.log('📈 Transactions data:', transactionsData, 'Transactions error:', transactionsError)
      if (!transactionsError && transactionsData) {
        setTransactions(transactionsData)
      }

      // Fetch API usage
      console.log('🔌 Fetching API usage...')
      const { data: usageData, error: usageError } = await supabase
        .from('api_usage')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      console.log('📡 API usage data:', usageData, 'API usage error:', usageError)
      if (!usageError && usageData) {
        setApiUsage(usageData)
      }

      console.log('✅ Credits data fetch completed')

    } catch (err) {
      console.error('❌ Error fetching credits data:', err)
      setError("Failed to load credits information")
    } finally {
      setLoading(false)
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <DollarSign className="h-4 w-4 text-green-500" />
      case 'usage':
        return <Zap className="h-4 w-4 text-blue-500" />
      case 'refund':
        return <TrendingUp className="h-4 w-4 text-yellow-500" />
      case 'bonus':
        return <DollarSign className="h-4 w-4 text-purple-500" />
      default:
        return <DollarSign className="h-4 w-4 text-gray-500" />
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'text-green-400'
      case 'usage':
        return 'text-blue-400'
      case 'refund':
        return 'text-yellow-400'
      case 'bonus':
        return 'text-purple-400'
      default:
        return 'text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading credits information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">API Credits</h1>
        <Link href="/dashboard" className="flex items-center text-blue-500 hover:text-blue-400">
          <ArrowLeft className="mr-2" />
          Back to Dashboard
        </Link>
      </div>

      {/* Purchase Credits Card */}
      <Card className="bg-[#141415] border border-gray-700 mb-6">
        <CardHeader>
          <CardTitle className="flex items-center text-green-400">
            <DollarSign className="mr-2 text-green-400" />
            <span className="text-green-400">Purchase Credits</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-sm mb-4">Buy API credits to use with any plan</p>
          <Link href="/credits/purchase">
            <Button className="bg-green-600 hover:bg-green-700">
              <DollarSign className="mr-2 h-4 w-4" />
              Buy Credits
            </Button>
          </Link>
        </CardContent>
      </Card>

      {error && (
        <Card className="bg-red-900/20 border-red-500 mb-4">
          <CardContent className="p-4">
            <p className="text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Credits Balance */}
        <Card className="bg-[#141415] border border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-green-400">
              <DollarSign className="mr-2 text-green-400" />
              Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {credits ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-400">{credits.balance}</div>
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
                <Link href="/credits/purchase">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Buy More Credits
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-gray-400">Loading credits...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Stats */}
        <Card className="bg-[#141415] border border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-400">
              <TrendingUp className="mr-2 text-blue-400" />
              Usage Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {apiUsage.reduce((sum, usage) => sum + usage.credits_used, 0)}
                </div>
                <p className="text-gray-400">Credits Used This Month</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">API Calls:</span>
                  <span className="font-semibold">{apiUsage.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Most Used Endpoint:</span>
                  <span className="font-semibold text-xs">
                    {apiUsage.length > 0 
                      ? apiUsage[0]?.endpoint?.split('/').pop() || 'N/A'
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-[#141415] border border-gray-700">
          <CardHeader>
            <CardTitle className="text-purple-400">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/credits/purchase">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Purchase Credits
              </Button>
            </Link>
            <Link href="/credits/usage">
              <Button variant="outline" className="w-full">
                View Usage Details
              </Button>
            </Link>
            <Link href="/billing">
              <Button variant="outline" className="w-full">
                Billing History
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="bg-[#141415] border border-gray-700 mt-6">
        <CardHeader>
          <CardTitle className="flex items-center text-yellow-400">
            <History className="mr-2 text-yellow-400" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-[#1A1A1B] rounded">
                  <div className="flex items-center space-x-3">
                    {getTransactionIcon(transaction.transaction_type)}
                    <div>
                      <div className="font-semibold">{transaction.description}</div>
                      <div className="text-sm text-gray-400">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className={`font-semibold ${getTransactionColor(transaction.transaction_type)}`}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">No transactions found</p>
          )}
        </CardContent>
      </Card>

      {/* Recent API Usage */}
      <Card className="bg-[#141415] border border-gray-700 mt-6">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-400">
            <Zap className="mr-2 text-blue-400" />
            Recent API Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          {apiUsage.length > 0 ? (
            <div className="space-y-3">
              {apiUsage.slice(0, 10).map((usage) => (
                <div key={usage.id} className="flex items-center justify-between p-3 bg-[#1A1A1B] rounded">
                  <div>
                    <div className="font-semibold">{usage.endpoint}</div>
                    <div className="text-sm text-gray-400">
                      {new Date(usage.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-blue-400">
                    -{usage.credits_used} credits
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">No API usage found</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
