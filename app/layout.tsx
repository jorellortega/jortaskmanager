import type { Metadata } from 'next'
import './globals.css'

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
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0E0E0F]">{children}</body>
    </html>
  )
}
