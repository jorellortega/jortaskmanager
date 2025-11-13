"use client"

import Link from "next/link"
import { Settings, UserIcon, CalendarDays, Clock, Target, StickyNote, Utensils, Dumbbell, DollarSign, Repeat, Users, ArrowRight, Heart, Sparkles } from "lucide-react"
import Script from "next/script"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AIChat } from "@/components/AIChat"

export default function Home() {
  const isLoggedIn = false // This should be replaced with actual authentication logic

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Task Manager by JOR",
    "description": "Transform your productivity with Task Manager by JOR. Organize calendar, appointments, goals, notes, meal planning, fitness tracking, expenses, routines, cycle tracking, and peer collaboration all in one powerful app.",
    "url": "https://jortaskmanager.vercel.app",
    "applicationCategory": "ProductivityApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free forever task management application"
    },
    "featureList": [
      "Calendar Management",
      "Appointment Tracking", 
      "Goal Setting and Tracking",
      "Note Taking",
      "Meal Planning",
      "Fitness Tracking",
      "Expense Management",
      "Routine Building",
      "Peer Collaboration",
      "Cycle Tracking"
    ],
    "author": {
      "@type": "Person",
      "name": "JOR"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Task Manager by JOR"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "150"
    }
  }

  return (
    <>
      <Script
        id="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white flex flex-col">
        <header>
          <div className="flex justify-center mt-16 mb-10">
            <div className="bg-[#18181A] border border-green-700 rounded-xl shadow-lg p-8 max-w-xl w-full text-center">
              <h1 className="text-3xl font-extrabold mb-2 flex items-center justify-center gap-2 bg-gradient-to-r from-white via-green-300 to-green-500 text-transparent bg-clip-text">
                JOR TASK MANAGER
              </h1>
              <p className="text-green-200 text-lg mb-2 font-medium">
                Organize your week, achieve your goals, and boost your productivity—all in one place.
              </p>
            </div>
          </div>
          <div className="flex justify-center mb-10">
            <Link
              href="/auth"
              className="inline-block px-8 py-4 rounded-full text-lg font-bold text-white bg-gradient-to-r from-white via-green-300 to-green-500 shadow-lg hover:from-white hover:via-green-400 hover:to-green-600 hover:shadow-[0_0_16px_#22c55e] focus:shadow-[0_0_16px_#22c55e] transition-all duration-200 border-2 border-green-500 focus:outline-none focus:ring-4 focus:ring-green-300 focus:ring-offset-2"
            >
              Login / Sign Up
            </Link>
          </div>
          <nav className="flex justify-end mb-4 space-x-4">
            {isLoggedIn && (
              <Link href="/settings" className="flex items-center text-blue-500 hover:text-blue-400">
                <Settings className="h-5 w-5 mr-1" />
                Settings
              </Link>
            )}
          </nav>
        </header>
        <div className="flex-grow flex flex-col items-center justify-center">
          {/* AI Chat Section */}
          <section className="w-full max-w-4xl mb-10" aria-labelledby="ai-chat-heading">
            <div className="mb-4">
              <h2 id="ai-chat-heading" className="text-2xl font-bold text-center mb-2 bg-gradient-to-r from-blue-400 via-green-400 to-purple-400 text-transparent bg-clip-text">
                AI Assistant
              </h2>
              <p className="text-gray-400 text-center text-sm">
                Get instant help with task management, productivity tips, and more
              </p>
            </div>
            <AIChat />
          </section>

          {/* Feature Advertisement Section */}
          <section className="w-full max-w-4xl mb-10" aria-labelledby="features-heading">
            <h2 id="features-heading" className="text-xl font-semibold mb-6 text-center bg-gradient-to-r from-blue-400 via-green-400 to-pink-400 text-transparent bg-clip-text">Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {/* Feature: Calendar */}
              <article className="bg-[#18181A] rounded-lg p-5 flex flex-col items-center shadow-md border border-gray-800">
                <CalendarDays className="h-7 w-7 text-blue-400 mb-2" />
                <h3 className="font-bold">Calendar</h3>
                <p className="text-sm text-gray-400 text-center">Organize your events and never miss a date.</p>
              </article>
              {/* Feature: Appointments */}
              <article className="bg-[#18181A] rounded-lg p-5 flex flex-col items-center shadow-md border border-gray-800">
                <Clock className="h-7 w-7 text-blue-400 mb-2" />
                <h3 className="font-bold">Appointments</h3>
                <p className="text-sm text-gray-400 text-center">Track meetings and important appointments.</p>
              </article>
              {/* Feature: Goals */}
              <article className="bg-[#18181A] rounded-lg p-5 flex flex-col items-center shadow-md border border-gray-800">
                <Target className="h-7 w-7 text-red-400 mb-2" />
                <h3 className="font-bold">Goals</h3>
                <p className="text-sm text-gray-400 text-center">Set, track, and achieve your personal goals.</p>
              </article>
              {/* Feature: Notes */}
              <article className="bg-[#18181A] rounded-lg p-5 flex flex-col items-center shadow-md border border-gray-800">
                <StickyNote className="h-7 w-7 text-yellow-400 mb-2" />
                <h3 className="font-bold">Notes</h3>
                <p className="text-sm text-gray-400 text-center">Quickly jot down ideas and important info.</p>
              </article>
              {/* Feature: Meal Planning */}
              <article className="bg-[#18181A] rounded-lg p-5 flex flex-col items-center shadow-md border border-gray-800">
                <Utensils className="h-7 w-7 text-orange-400 mb-2" />
                <h3 className="font-bold">Meal Planning</h3>
                <p className="text-sm text-gray-400 text-center">Plan your meals and stay healthy.</p>
              </article>
              {/* Feature: Fitness */}
              <article className="bg-[#18181A] rounded-lg p-5 flex flex-col items-center shadow-md border border-gray-800">
                <Dumbbell className="h-7 w-7 text-green-400 mb-2" />
                <h3 className="font-bold">Fitness</h3>
                <p className="text-sm text-gray-400 text-center">Track workouts and monitor your progress.</p>
              </article>
              {/* Feature: Expenses */}
              <article className="bg-[#18181A] rounded-lg p-5 flex flex-col items-center shadow-md border border-gray-800">
                <DollarSign className="h-7 w-7 text-green-400 mb-2" />
                <h3 className="font-bold">Expenses</h3>
                <p className="text-sm text-gray-400 text-center">Manage your spending and budgets.</p>
              </article>
              {/* Feature: Routines */}
              <article className="bg-[#18181A] rounded-lg p-5 flex flex-col items-center shadow-md border border-gray-800">
                <Repeat className="h-7 w-7 text-purple-400 mb-2" />
                <h3 className="font-bold">Routines</h3>
                <p className="text-sm text-gray-400 text-center">Build healthy habits and daily routines.</p>
              </article>
              {/* Feature: Peer Sync */}
              <article className="bg-[#18181A] rounded-lg p-5 flex flex-col items-center shadow-md border border-gray-800">
                <Users className="h-7 w-7 text-blue-400 mb-2" />
                <h3 className="font-bold">Peer Sync</h3>
                <p className="text-sm text-gray-400 text-center">Collaborate and sync with friends or peers.</p>
              </article>
              {/* Feature: Cycle Tracking */}
              <article className="bg-[#18181A] rounded-lg p-5 flex flex-col items-center shadow-md border border-gray-800">
                <Heart className="h-7 w-7 text-pink-400 mb-2" />
                <h3 className="font-bold">Cycle Tracking</h3>
                <p className="text-sm text-gray-400 text-center">Track your menstrual cycle and health patterns.</p>
              </article>
            </div>
          </section>

          {/* Call to Action Section */}
          <section className="w-full max-w-4xl mb-10" aria-labelledby="cta-heading">
            <div className="bg-[#141414] border border-gray-700 rounded-xl p-8">
              <div className="text-center">
                <h3 id="cta-heading" className="text-3xl font-bold mb-4 text-white">
                  Ready to Transform Your Productivity?
                </h3>
                <p className="text-lg text-gray-200 mb-6 max-w-2xl mx-auto">
                  Start organizing your life with Task Manager by JOR. Begin your journey to better productivity today!
                </p>
                <Link 
                  href="/auth" 
                  className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-200"
                >
                  Get Started Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>
          </section>

          {/* Plans Card Section */}
          <section className="w-full max-w-4xl mb-10" aria-labelledby="plans-heading">
            <Card className="bg-[#141414] border border-gray-700">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center text-white flex items-center justify-center gap-2">
                  <Sparkles className="h-6 w-6 text-yellow-400" />
                  Upgrade Your Experience
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-gray-200 text-lg">
                  Unlock premium features and get more out of your productivity journey
                </p>
                <p className="text-gray-300 text-sm">
                  Choose from our flexible plans designed to fit your needs
                </p>
                <Link href="/billing/plans">
                  <Button className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-6 text-lg">
                    View Plans & Pricing
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </section>
        </div>
        
        {/* Footer */}
        <footer className="mt-auto py-6 border-t border-gray-800">
          <div className="container mx-auto px-4 text-center">
            <p className="text-gray-400 text-sm">
              Developed by <span className="text-blue-400 font-semibold">JOR</span> powered by{' '}
              <span className="text-green-400 font-semibold">Covion Studio</span> • Copyright © 2025
            </p>
          </div>
        </footer>
      </main>
    </>
  )
}