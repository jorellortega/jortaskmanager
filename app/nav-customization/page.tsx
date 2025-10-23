"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Settings, Save, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  CalendarDays, Clock, DollarSign, Briefcase, Sun, Utensils, Dumbbell, Cake, 
  Repeat, CheckSquare, Target, Users, Lightbulb, Plane, Clock as ClockIcon, 
  StickyNote, BookOpen, LayoutDashboard, Monitor, Trophy, Heart, Baby 
} from 'lucide-react';

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
  
  // Development
  { href: '/selfdevelopment', icon: <Trophy />, color: 'text-yellow-400', glow: '#fde047', label: 'Self Development', category: 'Development', isDefault: false },
];

export default function NavCustomizationPage() {
  const [user, setUser] = useState<any>(null);
  const [customNavItems, setCustomNavItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchUserAndNavItems();
  }, []);

  const fetchUserAndNavItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push('/auth');
        return;
      }
      
      setUser(user);
      
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
    } catch (err) {
      setError('Failed to load navigation settings');
      console.error('Error fetching navigation settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleItem = (href: string) => {
    setCustomNavItems(prev => {
      if (prev.includes(href)) {
        return prev.filter(item => item !== href);
      } else {
        return [...prev, href];
      }
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      if (!user) {
        setError('User not found');
        return;
      }

      // Get all possible categories from allNavItems
      const allCategories = allNavItems.map(item => item.href.replace('/', ''));
      
      // Prepare upsert data for peer_sync_preferences table
      const upsertData = allCategories.map(category => ({
        user_id: user.id,
        category: category,
        enabled: customNavItems.includes(`/${category}`)
      }));

      // Save to user metadata directly (skip database for now)
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          custom_nav_items: customNavItems,
        }
      });

      if (metadataError) {
        setError(metadataError.message);
        return;
      }

      setSuccess('Navigation settings saved successfully!');
    } catch (err) {
      setError('Failed to save navigation settings');
      console.error('Error saving navigation settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    const defaultItems = allNavItems.filter(item => item.isDefault).map(item => item.href);
    setCustomNavItems(defaultItems);
  };

  const isItemEnabled = (href: string) => {
    return customNavItems.includes(href);
  };

  const getItemsByCategory = () => {
    const categories: { [key: string]: NavItem[] } = {};
    
    allNavItems.forEach(item => {
      if (!categories[item.category]) {
        categories[item.category] = [];
      }
      categories[item.category].push(item);
    });
    
    return categories;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#18181A] to-[#232325]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#18181A] to-[#232325] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/settings">
              <Button
                variant="outline"
                size="sm"
                className="text-white border-gray-400 bg-gray-800 hover:bg-gray-700 hover:text-white hover:border-gray-500"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Settings
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <Settings className="w-8 h-8" />
                Navigation Customization
              </h1>
              <p className="text-gray-400 mt-2">Choose which pages appear in your navigation bar</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-900/50 border border-red-500 rounded-md text-red-200 text-sm mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-green-900/50 border border-green-500 rounded-md text-green-200 text-sm mb-6">
            {success}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            variant="outline"
            onClick={handleResetToDefaults}
            className="text-white border-gray-400 bg-gray-800 hover:bg-gray-700 hover:text-white hover:border-gray-500"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
        </div>

        {/* Navigation Items by Category */}
        <div className="space-y-6">
          {Object.entries(getItemsByCategory()).map(([category, items]) => (
            <Card key={category} className="bg-[#1e1e20] border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  {category}
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                    {items.filter(item => isItemEnabled(item.href)).length} / {items.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((item) => (
                    <div
                      key={item.href}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                        isItemEnabled(item.href)
                          ? 'bg-blue-900/20 border-blue-500'
                          : 'bg-gray-800 border-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`${item.color} ${isItemEnabled(item.href) ? 'opacity-100' : 'opacity-50'}`}>
                          {React.cloneElement(item.icon, { className: 'w-8 h-8' })}
                        </div>
                        <div>
                          <div className="text-white font-medium">{item.label}</div>
                          <div className="text-gray-400 text-sm">{item.href}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.isDefault && (
                          <Badge variant="outline" className="text-xs">
                            Default
                          </Badge>
                        )}
                        <Switch
                          checked={isItemEnabled(item.href)}
                          onCheckedChange={() => handleToggleItem(item.href)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Preview Section */}
        <Card className="bg-[#1e1e20] border-gray-800 mt-8">
          <CardHeader>
            <CardTitle className="text-white">Navigation Preview</CardTitle>
            <p className="text-gray-400 text-sm">This is how your navigation bar will look</p>
          </CardHeader>
          <CardContent>
            <div className="bg-[#141415] border border-gray-700 p-4 rounded-xl">
              <div className="flex flex-nowrap items-center gap-4 overflow-x-auto">
                <div className="flex items-center gap-4 min-w-max">
                  {allNavItems
                    .filter(item => isItemEnabled(item.href))
                    .map(({ href, icon, color, glow }) => (
                      <div
                        key={href}
                        className="flex items-center justify-center p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                        style={{ filter: `drop-shadow(0 0 8px ${glow})` }}
                      >
                        {React.cloneElement(icon, {
                          className: `h-5 w-5 ${color}`
                        })}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
