import type { Metadata } from 'next'
import './globals.css'
import { CalendarDays, Clock, DollarSign, Briefcase, Sun, Utensils, Dumbbell, Cake, Repeat, CheckSquare, Target, Users, Lightbulb, Plane, Clock as ClockIcon, StickyNote, BookOpen, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Task Manager by JOR - Comprehensive Weekly Task Management',
  description: 'Transform your productivity with Task Manager by JOR. Organize calendar, appointments, goals, notes, meal planning, fitness tracking, expenses, routines, and peer collaboration all in one powerful app.',
  keywords: 'task manager, productivity app, weekly planner, goal tracking, calendar management, meal planning, fitness tracker, expense manager, routine builder, peer collaboration',
  authors: [{ name: 'JOR' }],
  creator: 'JOR',
  publisher: 'JOR',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://jortaskmanager.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Task Manager by JOR - Comprehensive Weekly Task Management',
    description: 'Transform your productivity with Task Manager by JOR. Organize calendar, appointments, goals, notes, meal planning, fitness tracking, expenses, routines, and peer collaboration all in one powerful app.',
    url: 'https://jortaskmanager.vercel.app',
    siteName: 'Task Manager by JOR',
    images: [
      {
        url: '/placeholder-logo.png',
        width: 1200,
        height: 630,
        alt: 'Task Manager by JOR - Productivity App',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Task Manager by JOR - Comprehensive Weekly Task Management',
    description: 'Transform your productivity with Task Manager by JOR. Organize calendar, appointments, goals, notes, meal planning, fitness tracking, expenses, routines, and peer collaboration all in one powerful app.',
    images: ['/placeholder-logo.png'],
    creator: '@jortaskmanager',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  // fallback for SSR: don't show on home
  const showNavBar = pathname !== '/';
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0E0E0F]">
        {showNavBar && (
          <div className="container mx-auto">
            <div className="bg-[#141415] border border-gray-700 mb-4 mt-2 p-2 rounded-xl">
              <div className="flex flex-nowrap items-center gap-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent px-2 py-2 w-full">
                <div className="flex items-center gap-4 min-w-max">
                  <Link href="/dashboard"><LayoutDashboard className="h-5 w-5 text-blue-400 cursor-pointer hover:text-blue-300" /></Link>
                  <Link href="/calendar"><CalendarDays className="h-5 w-5 text-blue-400 cursor-pointer hover:text-blue-300" /></Link>
                  <Link href="/appointments"><Clock className="h-5 w-5 text-blue-400 cursor-pointer hover:text-blue-300" /></Link>
                  <Link href="/expenses"><DollarSign className="h-5 w-5 text-green-400 cursor-pointer hover:text-green-300" /></Link>
                  <Link href="/business"><Briefcase className="h-5 w-5 text-gray-200 cursor-pointer hover:text-green-400" /></Link>
                  <Link href="/leisure"><Sun className="h-5 w-5 text-yellow-400 cursor-pointer hover:text-yellow-300" /></Link>
                  <Link href="/meal-planning"><Utensils className="h-5 w-5 text-orange-400 cursor-pointer hover:text-orange-300" /></Link>
                  <Link href="/fitness"><Dumbbell className="h-5 w-5 text-green-400 cursor-pointer hover:text-green-300" /></Link>
                  <Link href="/birthdays"><Cake className="h-5 w-5 text-pink-400 cursor-pointer hover:text-pink-300" /></Link>
                  <Link href="/routines"><Repeat className="h-5 w-5 text-purple-400 cursor-pointer hover:text-purple-300" /></Link>
                  <Link href="/todo"><CheckSquare className="h-5 w-5 text-indigo-400 cursor-pointer hover:text-indigo-300" /></Link>
                  <Link href="/goals"><Target className="h-5 w-5 text-red-400 cursor-pointer hover:text-red-300" /></Link>
                  <Link href="/peersync"><Users className="h-5 w-5 text-blue-400 cursor-pointer hover:text-blue-300" /></Link>
                  <Link href="/brainstorming"><Lightbulb className="h-5 w-5 text-yellow-400 cursor-pointer hover:text-yellow-300" /></Link>
                  <Link href="/travel"><Plane className="h-5 w-5 text-purple-400 cursor-pointer hover:text-purple-300" /></Link>
                  <Link href="/work-clock"><ClockIcon className="h-5 w-5 text-blue-400 cursor-pointer hover:text-blue-300" /></Link>
                  <Link href="/notes"><StickyNote className="h-5 w-5 text-yellow-400 cursor-pointer hover:text-yellow-300" /></Link>
                  <Link href="/journal"><BookOpen className="h-5 w-5 text-green-400 cursor-pointer hover:text-green-300" /></Link>
                </div>
              </div>
            </div>
          </div>
        )}
        {children}
      </body>
    </html>
  )
}
