"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Clock, DollarSign, Briefcase, Sun, Utensils, Dumbbell, Cake, Repeat, CheckSquare, Target, Users, Lightbulb, Plane, Clock as ClockIcon, StickyNote, BookOpen, LayoutDashboard } from 'lucide-react';

const navIcons = [
  { href: '/dashboard', icon: <LayoutDashboard />, color: 'text-blue-400', glow: '#3b82f6' },
  { href: '/calendar', icon: <CalendarDays />, color: 'text-blue-400', glow: '#3b82f6' },
  { href: '/appointments', icon: <Clock />, color: 'text-blue-400', glow: '#3b82f6' },
  { href: '/expenses', icon: <DollarSign />, color: 'text-green-400', glow: '#22c55e' },
  { href: '/business', icon: <Briefcase />, color: 'text-gray-200', glow: '#22c55e' },
  { href: '/leisure', icon: <Sun />, color: 'text-yellow-400', glow: '#fde047' },
  { href: '/meal-planning', icon: <Utensils />, color: 'text-orange-400', glow: '#fb923c' },
  { href: '/fitness', icon: <Dumbbell />, color: 'text-green-400', glow: '#22c55e' },
  { href: '/birthdays', icon: <Cake />, color: 'text-pink-400', glow: '#f472b6' },
  { href: '/routines', icon: <Repeat />, color: 'text-purple-400', glow: '#a78bfa' },
  { href: '/todo', icon: <CheckSquare />, color: 'text-indigo-400', glow: '#818cf8' },
  { href: '/goals', icon: <Target />, color: 'text-red-400', glow: '#f87171' },
  { href: '/peersync', icon: <Users />, color: 'text-blue-400', glow: '#3b82f6' },
  { href: '/brainstorming', icon: <Lightbulb />, color: 'text-yellow-400', glow: '#fde047' },
  { href: '/travel', icon: <Plane />, color: 'text-purple-400', glow: '#a78bfa' },
  { href: '/work-clock', icon: <ClockIcon />, color: 'text-blue-400', glow: '#3b82f6' },
  { href: '/notes', icon: <StickyNote />, color: 'text-yellow-400', glow: '#fde047' },
  { href: '/journal', icon: <BookOpen />, color: 'text-green-400', glow: '#22c55e' },
];

export default function TopNavBar() {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  if (typeof window !== 'undefined' && window.location.pathname === '/') return null;
  return (
    <div className="container mx-auto">
      <div className="bg-[#141415] border border-gray-700 mb-4 mt-2 p-2 rounded-xl">
        <div className="flex flex-nowrap items-center gap-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent px-2 py-2 w-full">
          <div className="flex items-center gap-4 min-w-max">
            {navIcons.map(({ href, icon, color, glow }, idx) => {
              const isActive = selectedIdx === idx;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSelectedIdx(idx)}
                  className={`transition-transform duration-200 flex items-center justify-center ${isActive ? 'scale-125 ring-2 ring-white bg-[#18181A] rounded-xl' : ''}`}
                  style={isActive ? { padding: '0.35rem', filter: `drop-shadow(0 0 12px ${glow})` } : { padding: 0 }}
                >
                  {React.cloneElement(icon, {
                    className: `h-5 w-5 ${color} cursor-pointer hover:text-white ${isActive ? 'text-white' : ''}`
                  })}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 