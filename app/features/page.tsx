import { CalendarDays, Clock, Target, StickyNote, Utensils, Dumbbell, DollarSign, Repeat, Users, Home as HomeIcon } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Features | JOR Task Manager",
  description: "Discover all the powerful features of JOR Task Manager: calendar, appointments, goals, notes, meal planning, fitness, expenses, routines, peer sync, and more. Boost your productivity and stay organized!",
  openGraph: {
    title: "Features | JOR Task Manager",
    description: "Explore all the tools and features that make JOR Task Manager your all-in-one productivity solution.",
    url: "https://jortaskmanager.vercel.app/features",
    siteName: "JOR Task Manager",
    images: [
      {
        url: "/placeholder-logo.png",
        width: 1200,
        height: 630,
        alt: "JOR Task Manager Features",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Features | JOR Task Manager",
    description: "Explore all the tools and features that make JOR Task Manager your all-in-one productivity solution.",
    images: ["/placeholder-logo.png"],
    creator: "@jortaskmanager",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const features = [
  {
    icon: <CalendarDays className="h-8 w-8 text-blue-400 mb-2" />, 
    title: "Calendar",
    description: "Organize your events and never miss a date. Sync with your routines and appointments for a seamless schedule.",
  },
  {
    icon: <Clock className="h-8 w-8 text-blue-400 mb-2" />, 
    title: "Appointments",
    description: "Track meetings and important appointments. Get reminders and manage your time efficiently.",
  },
  {
    icon: <Target className="h-8 w-8 text-red-400 mb-2" />, 
    title: "Goals",
    description: "Set, track, and achieve your personal and professional goals. Visualize your progress and stay motivated.",
  },
  {
    icon: <StickyNote className="h-8 w-8 text-yellow-400 mb-2" />, 
    title: "Notes",
    description: "Quickly jot down ideas, important info, and to-dos. Organize your notes for easy access.",
  },
  {
    icon: <Utensils className="h-8 w-8 text-orange-400 mb-2" />, 
    title: "Meal Planning",
    description: "Plan your meals, create shopping lists, and maintain a healthy diet with ease.",
  },
  {
    icon: <Dumbbell className="h-8 w-8 text-green-400 mb-2" />, 
    title: "Fitness",
    description: "Track workouts, monitor your progress, and stay on top of your fitness goals.",
  },
  {
    icon: <DollarSign className="h-8 w-8 text-green-400 mb-2" />, 
    title: "Expenses",
    description: "Manage your spending, set budgets, and keep your finances in check.",
  },
  {
    icon: <Repeat className="h-8 w-8 text-purple-400 mb-2" />, 
    title: "Routines",
    description: "Build healthy habits and daily routines. Automate recurring tasks and stay consistent.",
  },
  {
    icon: <Users className="h-8 w-8 text-blue-400 mb-2" />, 
    title: "Peer Sync",
    description: "Collaborate and sync with friends or peers. Share tasks, routines, and progress for accountability.",
  },
];

export default function FeaturesPage() {
  return (
    <main className="container mx-auto p-8 min-h-screen text-white">
      <div className="flex items-center mb-6">
        <Link
          href="/"
          className="inline-flex items-center px-5 py-2 rounded-full text-base font-semibold text-white bg-gradient-to-r from-green-400 via-green-500 to-green-600 shadow hover:from-green-500 hover:to-green-700 transition-all duration-200 border-2 border-green-500 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
        >
          <HomeIcon className="h-5 w-5 mr-2" /> Home
        </Link>
      </div>
      <h1 className="text-3xl font-extrabold mb-4 text-center bg-gradient-to-r from-green-400 via-blue-400 to-pink-400 text-transparent bg-clip-text">
        Explore All Features
      </h1>
      <p className="text-lg text-center text-gray-300 mb-10 max-w-2xl mx-auto">
        JOR Task Manager is packed with powerful tools to help you organize, plan, and achieve more every week. Discover everything you can do below!
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {features.map((feature) => (
          <div key={feature.title} className="bg-[#18181A] rounded-xl p-6 flex flex-col items-center shadow-md border border-gray-800 hover:border-green-500 transition-all">
            {feature.icon}
            <h2 className="font-bold text-xl mb-2 text-green-300">{feature.title}</h2>
            <p className="text-gray-400 text-center mb-4">{feature.description}</p>
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-12">
        <Link href="/auth" className="inline-block px-8 py-4 rounded-full text-lg font-bold text-white bg-gradient-to-r from-green-400 via-green-500 to-green-600 shadow-lg hover:from-green-500 hover:to-green-700 transition-all duration-200 border-2 border-green-500 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2">
          Get Started Now
        </Link>
      </div>
    </main>
  );
} 