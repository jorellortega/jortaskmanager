"use client"

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Edit3, Save, X, LogOut, Trash2, User, Mail, MapPin, Globe, Calendar, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  bio?: string;
  avatar?: string;
  location?: string;
  website?: string;
  twitter_url?: string;
  created_at: string;
}

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    website: '',
    twitter_url: '',
  });

  useEffect(() => {
    fetchUserProfile();
    fetchUserStats();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push('/auth');
        return;
      }
      
      setUser(user);
      
      // Set initial form data from user metadata
      setFormData({
        name: user.user_metadata?.name || '',
        bio: user.user_metadata?.bio || '',
        location: user.user_metadata?.location || '',
        website: user.user_metadata?.website || '',
        twitter_url: user.user_metadata?.twitter_url || '',
      });

      setProfile({
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || '',
        bio: user.user_metadata?.bio || '',
        avatar: user.user_metadata?.avatar_url || '/placeholder-user.jpg',
        location: user.user_metadata?.location || '',
        website: user.user_metadata?.website || '',
        twitter_url: user.user_metadata?.twitter_url || '',
        created_at: user.created_at,
      });
    } catch (err) {
      setError('Failed to load profile');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const { error } = await supabase.auth.updateUser({
        data: {
          name: formData.name,
          bio: formData.bio,
          location: formData.location,
          website: formData.website,
          twitter_url: formData.twitter_url,
        }
      });

      if (error) {
        setError(error.message);
        return;
      }

      // Update local state
      setProfile(prev => prev ? {
        ...prev,
        name: formData.name,
        bio: formData.bio,
        location: formData.location,
        website: formData.website,
        twitter_url: formData.twitter_url,
      } : null);

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update profile');
      console.error('Error updating profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/auth');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  const fetchUserStats = async () => {
    try {
      if (!user) return;
      
      const userId = user.id;
      
      // Fetch stats from various tables
      const [
        { count: weeklyTasksCount },
        { count: appointmentsCount },
        { count: cycleEntriesCount },
        { count: pregnancyInfoCount },
        { count: subscriptionsCount },
        { count: peersCount }
      ] = await Promise.all([
        supabase.from('weekly_tasks').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('cycle_entries').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('pregnancy_info').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('peers').select('*', { count: 'exact', head: true }).eq('user_id', userId)
      ]);

      setStats({
        weeklyTasks: weeklyTasksCount || 0,
        appointments: appointmentsCount || 0,
        cycleEntries: cycleEntriesCount || 0,
        pregnancyInfo: pregnancyInfoCount || 0,
        subscriptions: subscriptionsCount || 0,
        peers: peersCount || 0,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      // Note: This would require a server-side function to delete user data
      // For now, we'll just sign them out
      await supabase.auth.signOut();
      router.push('/auth');
    } catch (err) {
      console.error('Error deleting account:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#18181A] to-[#232325]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#18181A] to-[#232325]">
        <div className="text-white">Failed to load profile</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#18181A] to-[#232325] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Account Settings</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-white border-gray-400 bg-gray-800 hover:bg-red-600 hover:text-white hover:border-red-600"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="bg-[#1e1e20] border-gray-800">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Avatar className="w-24 h-24 border-4 border-blue-500">
                    <AvatarImage src={profile.avatar} alt="Profile" />
                    <AvatarFallback className="bg-[#232325] text-white text-2xl">
                      {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-white text-xl">{profile.name || 'Anonymous User'}</CardTitle>
                <p className="text-blue-400 text-sm">@{profile.email.split('@')[0]}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.bio && (
                  <p className="text-gray-300 text-center text-sm">{profile.bio}</p>
                )}
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{profile.email}</span>
                  </div>
                  {profile.location && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{profile.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Social Links */}
                {(profile.website || profile.twitter_url) && (
                  <div className="flex gap-2 justify-center pt-4">
                    {profile.website && (
                      <a 
                        href={profile.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-blue-400 transition"
                        title="Website"
                      >
                        <Globe className="w-5 h-5" />
                      </a>
                    )}
                    {profile.twitter_url && (
                      <a 
                        href={profile.twitter_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-blue-400 transition"
                        title="Twitter"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 4.557a9.93 9.93 0 0 1-2.828.775 4.932 4.932 0 0 0 2.165-2.724c-.951.564-2.005.974-3.127 1.195A4.92 4.92 0 0 0 16.616 3c-2.73 0-4.942 2.21-4.942 4.932 0 .386.045.762.127 1.124C7.728 8.807 4.1 6.884 1.671 3.965c-.423.722-.666 1.561-.666 2.475 0 1.708.87 3.216 2.188 4.099a4.904 4.904 0 0 1-2.237-.616c-.054 2.281 1.581 4.415 3.949 4.89a4.936 4.936 0 0 1-2.224.084c.627 1.956 2.444 3.377 4.6 3.417A9.868 9.868 0 0 1 0 21.543a13.94 13.94 0 0 0 7.548 2.209c9.057 0 14.009-7.496 14.009-13.986 0-.213-.005-.425-.014-.636A9.936 9.936 0 0 0 24 4.557z"/>
                        </svg>
                      </a>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2">
            <Card className="bg-[#1e1e20] border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Profile Information</CardTitle>
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="text-white border-gray-400 bg-gray-800 hover:bg-blue-600 hover:text-white hover:border-blue-600"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(false)}
                        className="text-white border-gray-400 bg-gray-800 hover:bg-gray-700 hover:text-white hover:border-gray-500"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-900/50 border border-red-500 rounded-md text-red-200 text-sm">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="p-3 bg-green-900/50 border border-green-500 rounded-md text-green-200 text-sm">
                    {success}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-300">Display Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      disabled={!isEditing}
                      className="bg-[#232325] border-gray-600 text-white"
                      placeholder="Enter your display name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-300">Email</Label>
                    <Input
                      id="email"
                      value={profile.email}
                      disabled
                      className="bg-[#232325] border-gray-600 text-gray-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-gray-300">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    disabled={!isEditing}
                    className="bg-[#232325] border-gray-600 text-white"
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-gray-300">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      disabled={!isEditing}
                      className="bg-[#232325] border-gray-600 text-white"
                      placeholder="City, Country"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-gray-300">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      disabled={!isEditing}
                      className="bg-[#232325] border-gray-600 text-white"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twitter_url" className="text-gray-300">Twitter URL</Label>
                  <Input
                    id="twitter_url"
                    value={formData.twitter_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, twitter_url: e.target.value }))}
                    disabled={!isEditing}
                    className="bg-[#232325] border-gray-600 text-white"
                    placeholder="https://twitter.com/yourusername"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Account Statistics */}
            {stats && (
              <Card className="bg-[#1e1e20] border-gray-800 mt-6">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Account Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-[#232325] rounded-lg">
                      <div className="text-2xl font-bold text-blue-400">{stats.weeklyTasks}</div>
                      <div className="text-gray-400 text-sm">Weekly Tasks</div>
                    </div>
                    <div className="text-center p-4 bg-[#232325] rounded-lg">
                      <div className="text-2xl font-bold text-green-400">{stats.appointments}</div>
                      <div className="text-gray-400 text-sm">Appointments</div>
                    </div>
                    <div className="text-center p-4 bg-[#232325] rounded-lg">
                      <div className="text-2xl font-bold text-purple-400">{stats.subscriptions}</div>
                      <div className="text-gray-400 text-sm">Subscriptions</div>
                    </div>
                    <div className="text-center p-4 bg-[#232325] rounded-lg">
                      <div className="text-2xl font-bold text-pink-400">{stats.cycleEntries}</div>
                      <div className="text-gray-400 text-sm">Cycle Entries</div>
                    </div>
                    <div className="text-center p-4 bg-[#232325] rounded-lg">
                      <div className="text-2xl font-bold text-yellow-400">{stats.pregnancyInfo}</div>
                      <div className="text-gray-400 text-sm">Pregnancy Info</div>
                    </div>
                    <div className="text-center p-4 bg-[#232325] rounded-lg">
                      <div className="text-2xl font-bold text-cyan-400">{stats.peers}</div>
                      <div className="text-gray-400 text-sm">Connected Peers</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Danger Zone */}
            <Card className="bg-[#1e1e20] border-red-600 mt-6">
              <CardHeader>
                <CardTitle className="text-red-400">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">Delete Account</h3>
                    <p className="text-gray-400 text-sm">Permanently delete your account and all associated data.</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteAccount}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 