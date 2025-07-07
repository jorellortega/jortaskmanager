import Link from "next/link"
import { Settings, UserIcon, CalendarDays, Clock, Target, StickyNote, Utensils, Dumbbell, DollarSign, Repeat, Users, ArrowRight } from "lucide-react"
import Script from "next/script"

export default function Home() {
  const isLoggedIn = false // This should be replaced with actual authentication logic

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Task Manager by JOR",
    "description": "Transform your productivity with Task Manager by JOR. Organize calendar, appointments, goals, notes, meal planning, fitness tracking, expenses, routines, and peer collaboration all in one powerful app.",
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
      "Peer Collaboration"
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
              <h1 className="text-3xl font-extrabold mb-2 text-green-400 flex items-center justify-center gap-2">
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
              className="inline-block px-8 py-4 rounded-full text-lg font-bold text-white bg-gradient-to-r from-green-400 via-green-500 to-green-600 shadow-lg hover:from-green-500 hover:to-green-700 transition-all duration-200 border-2 border-green-500 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
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
            </div>
          </section>

          {/* Call to Action Section */}
          <section className="w-full max-w-4xl mb-10" aria-labelledby="cta-heading">
            <div className="bg-gradient-to-r from-white via-green-200 to-green-500 rounded-xl p-8">
              <div className="text-center">
                <h3 id="cta-heading" className="text-3xl font-bold mb-4 text-neutral-900">
                  Ready to Transform Your Productivity?
                </h3>
                <p className="text-lg text-gray-800 mb-6 max-w-2xl mx-auto">
                  Start organizing your life with Task Manager by JOR. Begin your journey to better productivity today – free for the first 100 users!
                </p>
                <Link 
                  href="/auth" 
                  className="inline-flex items-center px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-all duration-200 border border-gray-200"
                >
                  Get Started Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <p className="text-sm text-gray-700 mt-4">
                  No credit card required • Free for the first 100 users • Start in seconds
                </p>
              </div>
            </div>
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