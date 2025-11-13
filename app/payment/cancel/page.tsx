"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle, ArrowLeft, Home, CreditCard } from "lucide-react"
import Link from "next/link"

export default function PaymentCancelPage() {
  return (
    <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white flex items-center justify-center">
      <Card className="w-full max-w-md bg-[#141415] border border-gray-700">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <XCircle className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl text-red-400">Payment Cancelled</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-gray-400 mb-4">
              Your payment was cancelled. No charges have been made to your account.
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/credits/purchase">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <CreditCard className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </Link>
            
            <Link href="/billing/plans">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                View Plans
              </Button>
            </Link>
            
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>

          <div className="bg-blue-900/20 border border-blue-500 p-4 rounded">
            <h3 className="font-semibold text-blue-400 mb-2">Need Help?</h3>
            <p className="text-sm text-gray-300">
              If you're experiencing issues with payment, please contact our support team or try a different payment method.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
