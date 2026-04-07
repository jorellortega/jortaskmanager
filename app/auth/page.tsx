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

function readFormField(form: HTMLFormElement, name: string, fallback: string) {
  const el = form.elements.namedItem(name) as HTMLInputElement | null
  const raw = el?.value ?? fallback
  return typeof raw === "string" ? raw : fallback
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authBusy, setAuthBusy] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget

    // Browser/password-manager autofill often does not fire React onChange, so controlled
    // state can stay empty on the first submit. Always read the live DOM values too.
    const emailValue = readFormField(form, "auth-email", email).trim()
    const passwordValue = readFormField(form, "auth-password", password)
    const nameValue = readFormField(form, "auth-name", name).trim()
    const phoneValue = readFormField(form, "auth-phone", phone).trim()

    if (isLogin) {
      if (!emailValue || !passwordValue) {
        alert("Please enter your email and password.")
        return
      }
      setAuthBusy(true)
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailValue,
          password: passwordValue,
        })
        if (error) {
          alert(error.message)
          return
        }
        if (!data.session) {
          alert(
            "Could not start a session. If email confirmation is required, check your inbox first.",
          )
          return
        }
        router.push("/dashboard")
        router.refresh()
      } finally {
        setAuthBusy(false)
      }
    } else {
      if (!emailValue || !passwordValue || !nameValue || !phoneValue) {
        alert("Please fill in all fields.")
        return
      }
      setAuthBusy(true)
      try {
        const { data, error } = await supabase.auth.signUp({
          email: emailValue,
          password: passwordValue,
          options: {
            data: { name: nameValue, phone: phoneValue },
          },
        })

        if (error) {
          alert(`Signup failed: ${error.message}`)
          return
        }

        if (data.session) {
          router.push("/dashboard")
          router.refresh()
        } else {
          alert(
            "Account created. If your project requires email confirmation, check your inbox, then sign in.",
          )
        }
      } catch (err) {
        alert(`Signup failed: ${err instanceof Error ? err.message : String(err)}`)
      } finally {
        setAuthBusy(false)
      }
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
          <form onSubmit={handleSubmit} autoComplete="on">
            <div className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="auth-name"
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    required
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="auth-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className="bg-[#1A1A1B] border-gray-700 text-white"
                />
              </div>
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="auth-phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    required
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="auth-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  className="bg-[#1A1A1B] border-gray-700 text-white"
                />
              </div>
            </div>
            <Button type="submit" className="w-full mt-6" disabled={authBusy}>
              {authBusy ? "Please wait…" : isLogin ? "Login" : "Sign Up"}
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

