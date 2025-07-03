"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import useEmblaCarousel from "embla-carousel-react"
import { Button } from "@/components/ui/button"

type FeedItem = {
  id: number
  type: "task" | "appointment" | "leisure" | "fitness"
  content: string
  date: string
  completed?: boolean
}

export default function FeedPage() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  const [currentDate, setCurrentDate] = useState(new Date())

  const goToPreviousDay = () => {
    setCurrentDate((prevDate) => new Date(prevDate.setDate(prevDate.getDate() - 1)))
  }

  const goToNextDay = () => {
    setCurrentDate((prevDate) => new Date(prevDate.setDate(prevDate.getDate() + 1)))
  }

  useEffect(() => {
    // In a real application, you would fetch this data from your backend or local storage
    const mockFeedItems: FeedItem[] = [
      {
        id: 1,
        type: "task",
        content: "Review project proposal",
        date: format(new Date(), "yyyy-MM-dd"),
        completed: false,
      },
      { id: 2, type: "appointment", content: "Dentist Appointment at 14:00", date: format(new Date(), "yyyy-MM-dd") },
      { id: 3, type: "leisure", content: "Movie Night", date: format(new Date(), "yyyy-MM-dd") },
      { id: 4, type: "fitness", content: "Morning Run", date: format(new Date(), "yyyy-MM-dd") },
    ]
    setFeedItems(mockFeedItems)
  }, [])

  useEffect(() => {
    if (emblaApi) {
      const autoplay = () => {
        emblaApi.scrollNext()
      }

      const intervalId = setInterval(autoplay, 5000)

      return () => clearInterval(intervalId)
    }
  }, [emblaApi])

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
          <Carousel className="w-full h-full" ref={emblaRef} opts={{ loop: true }}>
            <CarouselContent>
              {feedItems.map((item) => (
                <CarouselItem key={item.id} className="h-full">
                  <div className="p-8 text-center h-full flex flex-col justify-center items-center">
                    <h2 className={`text-4xl font-bold mb-6 ${getTypeColor(item.type)}`}>
                      {capitalizeFirstLetter(item.type)}
                    </h2>
                    <p className="text-5xl mb-8 text-white">{item.content}</p>
                    {item.type === "task" && (
                      <span className={`text-3xl ${item.completed ? "text-green-400" : "text-yellow-400"}`}>
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
        </CardContent>
      </Card>
    </div>
  )
}

function getTypeColor(type: string): string {
  switch (type) {
    case "task":
      return "text-blue-300"
    case "appointment":
      return "text-red-300"
    case "leisure":
      return "text-yellow-300"
    case "fitness":
      return "text-green-300"
    default:
      return "text-gray-300"
  }
}

function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

