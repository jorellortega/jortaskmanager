"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLogin) {
      // Login with Supabase Auth
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        alert(error.message)
      } else {
        router.push('/dashboard');
      }
    } else {
      // Signup with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, phone }
        }
      })
      if (error) {
        alert(error.message)
        return
      }
      // No need to insert into public.users table here!
      router.push('/dashboard');
    }
  }

  return (
    <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md bg-[#141415] text-white">
        <CardHeader>
          {user && (
            <Link href="/dashboard" className="flex items-center text-blue-500 hover:text-blue-400 mb-4">
              <ArrowLeft className="mr-2" /> Back to Dashboard
            </Link>
          )}
          <div className="flex justify-center mb-4">
            <button
              className={`px-4 py-2 rounded-t-lg font-semibold focus:outline-none transition-colors duration-200 ${isLogin ? 'bg-[#18181A] text-blue-400 border-b-2 border-blue-400' : 'bg-transparent text-gray-400 hover:text-blue-300'}`}
              onClick={() => setIsLogin(true)}
              type="button"
            >
              Login
            </button>
            <button
              className={`px-4 py-2 rounded-t-lg font-semibold focus:outline-none transition-colors duration-200 ${!isLogin ? 'bg-[#18181A] text-blue-400 border-b-2 border-blue-400' : 'bg-transparent text-gray-400 hover:text-blue-300'}`}
              onClick={() => setIsLogin(false)}
              type="button"
            >
              Sign Up
            </button>
          </div>
          <CardTitle>{isLogin ? "Login" : "Sign Up"}</CardTitle>
          <CardDescription>{isLogin ? "Welcome back!" : "Create your account"}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-[#1A1A1B] border-gray-700 text-white"
                />
              </div>
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-[#1A1A1B] border-gray-700 text-white"
                />
              </div>
            </div>
            <Button type="submit" className="w-full mt-6">
              {isLogin ? "Login" : "Sign Up"}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          {/* Remove the old toggle link, no need for it with tabs */}
        </CardFooter>
      </Card>
    </div>
  )
}

