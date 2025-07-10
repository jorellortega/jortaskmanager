"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import useEmblaCarousel from "embla-carousel-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabaseClient"

type FeedItem = {
  id: string
  type: "appointment" | "goal"
  content: string
  date: string
  completed?: boolean
  time?: string
}

export default function FeedPage() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const goToPreviousDay = () => {
    setCurrentDate((prevDate) => new Date(prevDate.setDate(prevDate.getDate() - 1)))
  }

  const goToNextDay = () => {
    setCurrentDate((prevDate) => new Date(prevDate.setDate(prevDate.getDate() + 1)))
  }

  const fetchFeedData = async (date: Date) => {
    if (!userId) return

    setLoading(true)
    setError(null)
    const dateString = format(date, "yyyy-MM-dd")

    try {
      const allItems: FeedItem[] = []

      // Fetch appointments
      const { data: appointments, error: appointmentsError } = await supabase
        .from("appointments")
        .select("*")
        .eq("user_id", userId)
        .eq("date", dateString)
        .order("time", { ascending: true })

      if (appointmentsError && (appointmentsError.message || Object.keys(appointmentsError).length > 0)) {
        console.error("Error fetching appointments:", appointmentsError.message || appointmentsError)
      } else if (appointments) {
        appointments.forEach((apt) => {
          allItems.push({
            id: apt.id,
            type: "appointment",
            content: apt.title,
            date: apt.date,
            time: apt.time,
          })
        })
      }

      // Fetch goals
      const { data: goals, error: goalsError } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", userId)
        .gte("target_date", dateString)
        .lte("target_date", dateString)

      if (goalsError && (goalsError.message || Object.keys(goalsError).length > 0)) {
        console.error("Error fetching goals:", goalsError.message || goalsError)
      } else if (goals) {
        goals.forEach((goal) => {
          allItems.push({
            id: goal.id,
            type: "goal",
            content: goal.title,
            date: goal.target_date,
            completed: goal.completed,
          })
        })
      }

      // Sort items by time if available, otherwise by type
      allItems.sort((a, b) => {
        if (a.time && b.time) {
          return a.time.localeCompare(b.time)
        }
        return 0
      })

      setFeedItems(allItems)
    } catch (err) {
      setError("Failed to fetch feed data")
      console.error("Error fetching feed data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setError("You must be logged in to view your feed.")
        return
      }
      setUserId(user.id)
    }
    getUser()
  }, [])

  useEffect(() => {
    if (userId) {
      fetchFeedData(currentDate)
    }
  }, [userId, currentDate])

  useEffect(() => {
    if (emblaApi) {
      const autoplay = () => {
        emblaApi.scrollNext()
      }

      const intervalId = setInterval(autoplay, 5000)

      return () => clearInterval(intervalId)
    }
  }, [emblaApi])

  if (error) {
    return (
      <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white">
        <Link href="/dashboard" className="flex items-center text-blue-500 hover:text-blue-400 mb-4">
          <ArrowLeft className="mr-2" /> Back to Dashboard
        </Link>
        <div className="text-red-500 p-4">{error}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white flex flex-col">
      <Link href="/dashboard" className="flex items-center text-blue-500 hover:text-blue-400 mb-4">
        <ArrowLeft className="mr-2" /> Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold mb-4">Your Feed</h1>
      <Card className="bg-[#141415] border border-gray-700 flex-grow flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={goToPreviousDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex flex-col items-center">
              <span>Today's Activities</span>
              <span className="text-sm text-gray-400">{format(currentDate, "MMMM d, yyyy")}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={goToNextDay}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center p-0">
          {loading ? (
            <div className="text-center">
              <div className="text-2xl mb-4">Loading...</div>
            </div>
          ) : feedItems.length === 0 ? (
            <div className="text-center">
              <div className="text-2xl mb-4">No activities for this day</div>
              <p className="text-gray-400">Add some tasks, appointments, or activities to see them here</p>
            </div>
          ) : (
            <Carousel className="w-full h-full" ref={emblaRef} opts={{ loop: true }}>
              <CarouselContent>
                {feedItems.map((item) => (
                  <CarouselItem key={item.id} className="h-full">
                    <div className="p-8 text-center h-full flex flex-col justify-center items-center">
                      <h2 className={`text-4xl font-bold mb-6 ${getTypeColor(item.type)}`}>
                        {capitalizeFirstLetter(item.type)}
                      </h2>
                      <p className="text-3xl mb-4 text-white break-words max-w-md">{item.content}</p>
                      {item.time && (
                        <p className="text-xl mb-4 text-blue-300">at {formatTime(item.time)}</p>
                      )}
                      {item.type === "goal" && (
                        <span className={`text-2xl ${item.completed ? "text-green-400" : "text-yellow-400"}`}>
                          {item.completed ? "Completed" : "Pending"}
                        </span>
                      )}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function getTypeColor(type: string): string {
  switch (type) {
    case "appointment":
      return "text-red-300"
    case "goal":
      return "text-purple-300"
    default:
      return "text-gray-300"
  }
}

function getPriorityColor(priority: string): string {
  switch (priority.toLowerCase()) {
    case "high":
      return "text-red-400"
    case "medium":
      return "text-yellow-400"
    case "low":
      return "text-green-400"
    default:
      return "text-gray-400"
  }
}

function formatTime(timeString: string): string {
  // Convert HH:MM:SS to 12-hour format
  const [hours, minutes] = timeString.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

