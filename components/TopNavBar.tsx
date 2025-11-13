"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/use-auth';
import { CalendarDays, Clock, DollarSign, Briefcase, Sun, Utensils, Dumbbell, Cake, Repeat, CheckSquare, Target, Users, Lightbulb, Plane, Clock as ClockIcon, StickyNote, BookOpen, LayoutDashboard, Monitor, Award, Trophy, Heart, Baby, Settings, CreditCard, Zap, ListChecks } from 'lucide-react';

interface NavItem {
  href: string;
  icon: React.ReactElement;
  color: string;
  glow: string;
  label: string;
  category: string;
  isDefault: boolean;
}

const allNavItems: NavItem[] = [
  // Core/Default items
  { href: '/dashboard', icon: <LayoutDashboard />, color: 'text-blue-400', glow: '#3b82f6', label: 'Dashboard', category: 'Core', isDefault: true },
  { href: '/calendar', icon: <CalendarDays />, color: 'text-blue-400', glow: '#3b82f6', label: 'Calendar', category: 'Core', isDefault: true },
  { href: '/appointments', icon: <Clock />, color: 'text-blue-400', glow: '#3b82f6', label: 'Appointments', category: 'Core', isDefault: true },
  { href: '/todo', icon: <CheckSquare />, color: 'text-indigo-400', glow: '#818cf8', label: 'Todo', category: 'Core', isDefault: true },
  { href: '/checklist', icon: <ListChecks />, color: 'text-blue-400', glow: '#3b82f6', label: 'Checklist', category: 'Core', isDefault: false },
  { href: '/goals', icon: <Target />, color: 'text-red-400', glow: '#f87171', label: 'Goals', category: 'Core', isDefault: true },
  
  // Productivity
  { href: '/work', icon: <Monitor />, color: 'text-green-400', glow: '#22c55e', label: 'Work', category: 'Productivity', isDefault: true },
  { href: '/business', icon: <Briefcase />, color: 'text-gray-200', glow: '#22c55e', label: 'Business', category: 'Productivity', isDefault: false },
  { href: '/work-clock', icon: <ClockIcon />, color: 'text-blue-400', glow: '#3b82f6', label: 'Work Clock', category: 'Productivity', isDefault: false },
  { href: '/notes', icon: <StickyNote />, color: 'text-yellow-400', glow: '#fde047', label: 'Notes', category: 'Productivity', isDefault: true },
  { href: '/journal', icon: <BookOpen />, color: 'text-green-400', glow: '#22c55e', label: 'Journal', category: 'Productivity', isDefault: false },
  { href: '/brainstorming', icon: <Lightbulb />, color: 'text-yellow-400', glow: '#fde047', label: 'Brainstorming', category: 'Productivity', isDefault: false },
  
  // Lifestyle
  { href: '/meal-planning', icon: <Utensils />, color: 'text-orange-400', glow: '#fb923c', label: 'Meal Planning', category: 'Lifestyle', isDefault: true },
  { href: '/fitness', icon: <Dumbbell />, color: 'text-green-400', glow: '#22c55e', label: 'Fitness', category: 'Lifestyle', isDefault: true },
  { href: '/leisure', icon: <Sun />, color: 'text-yellow-400', glow: '#fde047', label: 'Leisure', category: 'Lifestyle', isDefault: false },
  { href: '/travel', icon: <Plane />, color: 'text-purple-400', glow: '#a78bfa', label: 'Travel', category: 'Lifestyle', isDefault: false },
  { href: '/routines', icon: <Repeat />, color: 'text-purple-400', glow: '#a78bfa', label: 'Routines', category: 'Lifestyle', isDefault: false },
  
  // Social & Events
  { href: '/birthdays', icon: <Cake />, color: 'text-pink-400', glow: '#f472b6', label: 'Birthdays', category: 'Social & Events', isDefault: false },
  { href: '/peersync', icon: <Users />, color: 'text-blue-400', glow: '#3b82f6', label: 'Peer Sync', category: 'Social & Events', isDefault: false },
  
  // Health & Wellness
  { href: '/cycle-tracking', icon: <Heart />, color: 'text-pink-400', glow: '#ec4899', label: 'Cycle Tracking', category: 'Health & Wellness', isDefault: false },
  { href: '/pregnancy', icon: <Heart />, color: 'text-pink-400', glow: '#ec4899', label: 'Pregnancy', category: 'Health & Wellness', isDefault: false },
  { href: '/wedding', icon: <Heart />, color: 'text-rose-400', glow: '#fb7185', label: 'Wedding', category: 'Health & Wellness', isDefault: false },
  { href: '/baby-shower', icon: <Baby />, color: 'text-blue-400', glow: '#3b82f6', label: 'Baby Shower', category: 'Health & Wellness', isDefault: false },
  
  // Finance
  { href: '/expenses', icon: <DollarSign />, color: 'text-green-400', glow: '#22c55e', label: 'Expenses', category: 'Finance', isDefault: true },
  { href: '/billing', icon: <CreditCard />, color: 'text-blue-400', glow: '#3b82f6', label: 'Billing', category: 'Finance', isDefault: true },
  { href: '/credits', icon: <Zap />, color: 'text-yellow-400', glow: '#fde047', label: 'Credits', category: 'Finance', isDefault: true },
  
  // Development
  { href: '/selfdevelopment', icon: <Trophy />, color: 'text-yellow-400', glow: '#fde047', label: 'Self Development', category: 'Development', isDefault: false },
  
  // Settings (always visible)
  { href: '/nav-customization', icon: <Settings />, color: 'text-gray-400', glow: '#6b7280', label: 'Settings', category: 'System', isDefault: true },
];

// Generate a unique instance ID for debugging
const instanceId = Math.random().toString(36).substr(2, 9);

export default function TopNavBar() {
  const { isAdmin } = useAuth();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [customNavItems, setCustomNavItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    console.log(`TopNavBar instance ${instanceId} mounting...`);
    setMounted(true);
    fetchCustomNavItems();
    return () => {
      console.log(`TopNavBar instance ${instanceId} unmounting...`);
    };
  }, []);

  const fetchCustomNavItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Use user metadata directly (skip database for now)
        const customItems = user.user_metadata?.custom_nav_items || [];
        if (customItems.length === 0) {
          console.log('No custom items in metadata, using defaults');
          const defaultItems = allNavItems.filter(item => item.isDefault).map(item => item.href);
          setCustomNavItems(defaultItems);
        } else {
          console.log('Using custom items from metadata');
          setCustomNavItems(customItems);
        }
      } else {
        // If no user, use default items
        const defaultItems = allNavItems.filter(item => item.isDefault).map(item => item.href);
        setCustomNavItems(defaultItems);
      }
    } catch (error) {
      console.error('Error fetching custom nav items:', error);
      // Fallback to default items
      const defaultItems = allNavItems.filter(item => item.isDefault).map(item => item.href);
      setCustomNavItems(defaultItems);
    } finally {
      setLoading(false);
    }
  };

  // Don't render on home page, but only after mounting to avoid hydration mismatch
  if (!mounted || pathname === '/' || loading) {
    console.log(`TopNavBar instance ${instanceId} not rendering - mounted: ${mounted}, pathname: ${pathname}, loading: ${loading}`);
    return null;
  }

  console.log(`TopNavBar instance ${instanceId} rendering...`);
  console.log('Custom nav items:', customNavItems);
  console.log('All nav items:', allNavItems.length);

  // Filter navigation items based on custom selection and admin status
  let visibleNavItems = allNavItems.filter(item => {
    // Hide brainstorming for non-admins
    if (item.href === '/brainstorming' && !isAdmin) {
      return false;
    }
    return customNavItems.includes(item.href);
  });
  
  // Always ensure settings icon is included
  const settingsItem = allNavItems.find(item => item.href === '/nav-customization');
  if (settingsItem && !visibleNavItems.some(item => item.href === '/nav-customization')) {
    visibleNavItems.push(settingsItem);
  }
  
  // If no items are visible, fallback to default items (excluding brainstorming for non-admins)
  if (visibleNavItems.length === 0) {
    console.log('No visible items, falling back to defaults');
    visibleNavItems = allNavItems.filter(item => {
      if (item.href === '/brainstorming' && !isAdmin) {
        return false;
      }
      return item.isDefault;
    });
  }
  
  console.log('Visible nav items:', visibleNavItems.length);

  return (
    <div className="container mx-auto" data-topnavbar-instance={instanceId}>
      <div className="bg-[#141415] border border-gray-700 mb-4 mt-2 p-2 rounded-xl">
        <div className="flex flex-nowrap items-center gap-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent px-2 py-2 w-full">
          <div className="flex items-center gap-4 min-w-max">
            {visibleNavItems.map(({ href, icon, color, glow }, idx) => {
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