import Link from "next/link"
import { Settings, UserIcon, CalendarDays, Clock, Target, StickyNote, Utensils, Dumbbell, DollarSign, Repeat, Users } from "lucide-react"

export default function Home() {
  const isLoggedIn = false // This should be replaced with actual authentication logic

  return (
    <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white flex flex-col">
      <h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-green-500 via-white to-red-500 text-transparent bg-clip-text">
        TASK MANAGER BY JOR
      </h1>
      <div className="flex justify-end mb-4 space-x-4">
        {isLoggedIn && (
          <Link href="/settings" className="flex items-center text-blue-500 hover:text-blue-400">
            <Settings className="h-5 w-5 mr-1" />
            Settings
          </Link>
        )}
        <Link href="/auth" className="flex items-center text-blue-500 hover:text-blue-400">
          <UserIcon className="h-5 w-5 mr-1" />
          Login / Sign Up
        </Link>
      </div>
      <div className="flex-grow flex flex-col items-center justify-center">
        {/* Feature Advertisement Section */}
        <div className="w-full max-w-4xl mb-10">
          <h2 className="text-xl font-semibold mb-6 text-center bg-gradient-to-r from-blue-400 via-green-400 to-pink-400 text-transparent bg-clip-text">Why use Task Manager by JOR?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {/* Feature: Calendar */}
            <div className="bg-[#18181A] rounded-lg p-5 flex flex-col items-center shadow-md border border-gray-800">
              <CalendarDays className="h-7 w-7 text-blue-400 mb-2" />
              <span className="font-bold">Calendar</span>
              <span className="text-sm text-gray-400 text-center">Organize your events and never miss a date.</span>
            </div>
            {/* Feature: Appointments */}
            <div className="bg-[#18181A] rounded-lg p-5 flex flex-col items-center shadow-md border border-gray-800">
              <Clock className="h-7 w-7 text-blue-400 mb-2" />
              <span className="font-bold">Appointments</span>
              <span className="text-sm text-gray-400 text-center">Track meetings and important appointments.</span>
            </div>
            {/* Feature: Goals */}
            <div className="bg-[#18181A] rounded-lg p-5 flex flex-col items-center shadow-md border border-gray-800">
              <Target className="h-7 w-7 text-red-400 mb-2" />
              <span className="font-bold">Goals</span>
              <span className="text-sm text-gray-400 text-center">Set, track, and achieve your personal goals.</span>
            </div>
            {/* Feature: Notes */}
            <div className="bg-[#18181A] rounded-lg p-5 flex flex-col items-center shadow-md border border-gray-800">
              <StickyNote className="h-7 w-7 text-yellow-400 mb-2" />
              <span className="font-bold">Notes</span>
              <span className="text-sm text-gray-400 text-center">Quickly jot down ideas and important info.</span>
            </div>
            {/* Feature: Meal Planning */}
            <div className="bg-[#18181A] rounded-lg p-5 flex flex-col items-center shadow-md border border-gray-800">
              <Utensils className="h-7 w-7 text-orange-400 mb-2" />
              <span className="font-bold">Meal Planning</span>
              <span className="text-sm text-gray-400 text-center">Plan your meals and stay healthy.</span>
            </div>
            {/* Feature: Fitness */}
            <div className="bg-[#18181A] rounded-lg p-5 flex flex-col items-center shadow-md border border-gray-800">
              <Dumbbell className="h-7 w-7 text-green-400 mb-2" />
              <span className="font-bold">Fitness</span>
              <span className="text-sm text-gray-400 text-center">Track workouts and monitor your progress.</span>
            </div>
            {/* Feature: Expenses */}
            <div className="bg-[#18181A] rounded-lg p-5 flex flex-col items-center shadow-md border border-gray-800">
              <DollarSign className="h-7 w-7 text-green-400 mb-2" />
              <span className="font-bold">Expenses</span>
              <span className="text-sm text-gray-400 text-center">Manage your spending and budgets.</span>
            </div>
            {/* Feature: Routines */}
            <div className="bg-[#18181A] rounded-lg p-5 flex flex-col items-center shadow-md border border-gray-800">
              <Repeat className="h-7 w-7 text-purple-400 mb-2" />
              <span className="font-bold">Routines</span>
              <span className="text-sm text-gray-400 text-center">Build healthy habits and daily routines.</span>
            </div>
            {/* Feature: Peer Sync */}
            <div className="bg-[#18181A] rounded-lg p-5 flex flex-col items-center shadow-md border border-gray-800">
              <Users className="h-7 w-7 text-blue-400 mb-2" />
              <span className="font-bold">Peer Sync</span>
              <span className="text-sm text-gray-400 text-center">Collaborate and sync with friends or peers.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}