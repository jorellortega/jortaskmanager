"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Lightbulb } from "lucide-react";

const mockSelfDevPriorities = [
  { id: 1, title: "Read 10 pages of a book" },
  { id: 2, title: "Complete an online course module" },
  { id: 3, title: "Practice meditation" },
  { id: 4, title: "Write in journal" },
  { id: 5, title: "Learn a new skill" },
];

export default function SelfDevelopmentPage() {
  return (
    <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white">
      <Link href="/dashboard" className="flex items-center text-blue-500 hover:text-blue-400 mb-4">
        <ArrowLeft className="mr-2" /> Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold mb-4 flex items-center">
        <Lightbulb className="mr-2" /> Self Development
      </h1>
      <Card className="bg-[#141415] border border-gray-700 mb-6">
        <CardHeader>
          <CardTitle className="!text-white">Your Self-Development Priorities</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {mockSelfDevPriorities.map((priority) => (
              <li key={priority.id} className="bg-[#1A1A1B] p-2 rounded !text-white">
                {priority.title}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card className="bg-[#141415] border border-gray-700">
        <CardHeader>
          <CardTitle className="text-green-400">How Self-Development Appears on Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <h3 className="text-green-400 font-bold mb-2">Self-Development:</h3>
          <ul className="list-disc list-inside">
            {mockSelfDevPriorities.slice(0, 2).map((priority) => (
              <li key={priority.id} className="text-white">
                {priority.title}
              </li>
            ))}
            <li className="text-gray-400">...and more</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
} 