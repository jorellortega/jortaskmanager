"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Trash2, Info } from "lucide-react"
import Link from "next/link"
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts"
import { ChartCard } from "@/components/ui/chart-card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type BubbleNode = {
  id: number
  text: string
  connections: number[]
}

type ChartData = {
  name: string
  value: number
}

type MindMapNode = {
  id: number
  text: string
  children: MindMapNode[]
}

type FishboneItem = {
  id: number
  category: string
  cause: string
}

type SixHatsThought = {
  id: number
  hat: string
  thought: string
}

type SwotItem = {
  id: number
  category: "strengths" | "weaknesses" | "opportunities" | "threats"
  text: string
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

const mockBubbles: BubbleNode[] = [
  {
    id: 1,
    text: "Project Management",
    connections: [2, 3],
  },
  {
    id: 2,
    text: "Task Tracking",
    connections: [1, 4],
  },
  {
    id: 3,
    text: "Team Collaboration",
    connections: [1, 4],
  },
  {
    id: 4,
    text: "Progress Monitoring",
    connections: [2, 3],
  },
]

const mockChartData: ChartData[] = [
  { name: "User Interface", value: 400 },
  { name: "Backend Services", value: 300 },
  { name: "Database Design", value: 300 },
  { name: "Testing", value: 200 },
  { name: "Documentation", value: 100 },
]

const mockMindMap: MindMapNode = {
  id: 1,
  text: "Weekly Task Manager",
  children: [
    {
      id: 2,
      text: "Features",
      children: [
        { id: 3, text: "Task Management", children: [] },
        { id: 4, text: "Calendar Integration", children: [] },
        { id: 5, text: "Team Collaboration", children: [] },
      ],
    },
    {
      id: 6,
      text: "Technologies",
      children: [
        { id: 7, text: "React", children: [] },
        { id: 8, text: "TypeScript", children: [] },
        { id: 9, text: "Next.js", children: [] },
      ],
    },
  ],
}

const mockFishboneItems: FishboneItem[] = [
  {
    id: 1,
    category: "People",
    cause: "Team collaboration issues",
  },
  {
    id: 2,
    category: "Process",
    cause: "Inefficient task management",
  },
  {
    id: 3,
    category: "Technology",
    cause: "Integration challenges",
  },
  {
    id: 4,
    category: "Environment",
    cause: "Remote work challenges",
  },
]

const mockSixHatsThoughts: SixHatsThought[] = [
  {
    id: 1,
    hat: "White",
    thought: "Current task completion rate is 75%",
  },
  {
    id: 2,
    hat: "Red",
    thought: "Team feels overwhelmed with current workload",
  },
  {
    id: 3,
    hat: "Black",
    thought: "Potential security risks in current implementation",
  },
  {
    id: 4,
    hat: "Yellow",
    thought: "New features could increase user engagement",
  },
  {
    id: 5,
    hat: "Green",
    thought: "Could implement AI-powered task suggestions",
  },
  {
    id: 6,
    hat: "Blue",
    thought: "Need to establish clear project milestones",
  },
]

const mockSwotItems: SwotItem[] = [
  {
    id: 1,
    category: "strengths",
    text: "User-friendly interface",
  },
  {
    id: 2,
    category: "strengths",
    text: "Strong team collaboration features",
  },
  {
    id: 3,
    category: "weaknesses",
    text: "Limited mobile support",
  },
  {
    id: 4,
    category: "weaknesses",
    text: "Complex setup process",
  },
  {
    id: 5,
    category: "opportunities",
    text: "Growing remote work market",
  },
  {
    id: 6,
    category: "opportunities",
    text: "Integration with popular tools",
  },
  {
    id: 7,
    category: "threats",
    text: "Competition from established players",
  },
  {
    id: 8,
    category: "threats",
    text: "Rapid technology changes",
  },
]

export default function BrainstormingPage() {
  const [bubbles, setBubbles] = useState<BubbleNode[]>(mockBubbles)
  const [newBubble, setNewBubble] = useState("")
  const [chartData, setChartData] = useState<ChartData[]>(mockChartData)
  const [newChartItem, setNewChartItem] = useState({ name: "", value: 0 })
  const [mindMap, setMindMap] = useState<MindMapNode>(mockMindMap)
  const [newMindMapItem, setNewMindMapItem] = useState("")
  const [fishboneItems, setFishboneItems] = useState<FishboneItem[]>(mockFishboneItems)
  const [newFishboneItem, setNewFishboneItem] = useState({ category: "", cause: "" })
  const [sixHatsThoughts, setSixHatsThoughts] = useState<SixHatsThought[]>(mockSixHatsThoughts)
  const [newSixHatsThought, setNewSixHatsThought] = useState({ hat: "", thought: "" })
  const [swotItems, setSwotItems] = useState<SwotItem[]>(mockSwotItems)
  const [newSwotItem, setNewSwotItem] = useState<{ category: "strengths" | "weaknesses" | "opportunities" | "threats"; text: string }>({ category: "strengths", text: "" })

  const addBubble = (e: React.FormEvent) => {
    e.preventDefault()
    if (newBubble.trim()) {
      setBubbles([...bubbles, { id: Date.now(), text: newBubble.trim(), connections: [] }])
      setNewBubble("")
    }
  }

  const deleteBubble = (id: number) => {
    setBubbles(bubbles.filter((bubble) => bubble.id !== id))
  }

  const addChartItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (newChartItem.name && newChartItem.value) {
      setChartData([...chartData, newChartItem])
      setNewChartItem({ name: "", value: 0 })
    }
  }

  const addMindMapItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMindMapItem.trim()) {
      setMindMap({
        ...mindMap,
        children: [...mindMap.children, { id: Date.now(), text: newMindMapItem.trim(), children: [] }],
      })
      setNewMindMapItem("")
    }
  }

  const addFishboneItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (newFishboneItem.category && newFishboneItem.cause) {
      setFishboneItems([...fishboneItems, { id: Date.now(), ...newFishboneItem }])
      setNewFishboneItem({ category: "", cause: "" })
    }
  }

  const addSixHatsThought = (e: React.FormEvent) => {
    e.preventDefault()
    if (newSixHatsThought.hat && newSixHatsThought.thought) {
      setSixHatsThoughts([...sixHatsThoughts, { id: Date.now(), ...newSixHatsThought }])
      setNewSixHatsThought({ hat: "", thought: "" })
    }
  }

  const addSwotItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (newSwotItem.text) {
      setSwotItems([...swotItems, { id: Date.now(), ...newSwotItem }])
      setNewSwotItem({ ...newSwotItem, text: "" })
    }
  }

  const renderMindMap = (node: MindMapNode, level = 0) => (
    <div key={node.id} className={`ml-${level * 4} mb-2`}>
      <div className="flex items-center">
        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
        <span>{node.text}</span>
      </div>
      {node.children.map((child) => renderMindMap(child, level + 1))}
    </div>
  )

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#101217] via-[#181c24] to-[#0E0E0F] text-white pb-24">
      <div className="fixed top-4 right-4 z-50 px-3 py-1 rounded-full bg-yellow-400/90 text-yellow-900 text-xs font-bold shadow-md border border-yellow-300 select-none pointer-events-none" style={{letterSpacing: '0.05em'}}>Under Construction</div>
      <div className="sticky top-0 z-30 bg-gradient-to-b from-[#101217] to-transparent pt-2 pb-4">
        <div className="container mx-auto flex items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center text-blue-400 hover:text-blue-300 font-semibold">
            <ArrowLeft className="mr-2" /> Dashboard
          </Link>
          <span className="text-xs text-gray-400 font-mono tracking-wide">Weekly Task Manager</span>
        </div>
        <div className="container mx-auto px-4 mt-2">
          <h1 className="text-4xl font-extrabold mb-1 tracking-tight drop-shadow-lg flex items-center gap-2">
            Brainstorming Tools
            <Info className="h-6 w-6 text-blue-400 cursor-pointer" aria-label="A suite of creative tools to help you generate, organize, and visualize ideas." />
          </h1>
          <p className="text-lg text-blue-200/80 mb-2 font-medium">Unleash your creativity with maps, charts, and frameworks for every idea.</p>
        </div>
      </div>

      <div className="container mx-auto px-2 md:px-4">
        <Tabs defaultValue="bubblemap" className="space-y-8 mt-2">
          <TabsList className="sticky top-20 z-20 flex w-full bg-[#181c24] rounded-xl shadow-lg border border-blue-900/30 overflow-x-auto gap-2 p-2 mb-6">
            <TabsTrigger
              value="bubblemap"
              className="data-[state=active]:bg-[#141415] data-[state=active]:text-white text-gray-400"
            >
              Bubble Map
            </TabsTrigger>
            <TabsTrigger
              value="charts"
              className="data-[state=active]:bg-[#141415] data-[state=active]:text-white text-gray-400"
            >
              Charts
            </TabsTrigger>
            <TabsTrigger
              value="mindmap"
              className="data-[state=active]:bg-[#141415] data-[state=active]:text-white text-gray-400"
            >
              Mind Map
            </TabsTrigger>
            <TabsTrigger
              value="fishbone"
              className="data-[state=active]:bg-[#141415] data-[state=active]:text-white text-gray-400"
            >
              Fishbone
            </TabsTrigger>
            <TabsTrigger
              value="sixhats"
              className="data-[state=active]:bg-[#141415] data-[state=active]:text-white text-gray-400"
            >
              Six Hats
            </TabsTrigger>
            <TabsTrigger
              value="swot"
              className="data-[state=active]:bg-[#141415] data-[state=active]:text-white text-gray-400"
            >
              SWOT
            </TabsTrigger>
          </TabsList>

          <div className="w-full flex items-center my-8">
            <div className="flex-grow border-t border-blue-900/30"></div>
          </div>
          <TabsContent value="bubblemap">
            <Card className="bg-gradient-to-br from-[#181c24] to-[#101217] border border-blue-900/40 mb-8 shadow-2xl p-2 md:p-6 animate-fade-in-section">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-5 w-5 text-blue-300" aria-label="Visually map out your ideas and see connections." />
                <span className="text-blue-200/80 text-sm">Bubble Map</span>
              </div>
              <CardHeader>
                <CardTitle className="text-white text-3xl tracking-wide mb-4 font-extrabold drop-shadow-lg">Bubble Map</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={addBubble} className="flex flex-col md:flex-row md:items-end gap-4 mb-8">
                  <div className="flex-1">
                    <Label htmlFor="newBubble" className="text-white text-lg font-semibold mb-2 block">New Idea</Label>
                    <Input
                      id="newBubble"
                      value={newBubble}
                      onChange={(e) => setNewBubble(e.target.value)}
                      className="bg-[#181c24] border-2 border-blue-700/40 text-white rounded-xl px-4 py-3 focus:border-blue-400 focus:ring-2 focus:ring-blue-500 transition-all text-lg shadow-inner"
                      placeholder="Enter a new idea"
                    />
                  </div>
                  <Button type="submit" className="bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:from-green-500 hover:to-blue-600 transition-all text-lg mt-2 md:mt-0">
                    Add Bubble
                  </Button>
                </form>
                <div className="w-full min-h-[200px] flex items-center justify-center">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full place-items-center">
                    {bubbles.map((bubble) => (
                      <div
                        key={bubble.id}
                        className="relative flex items-center justify-center animate-fade-in"
                        style={{ animation: 'fadeIn 0.5s' }}
                      >
                        <div
                          className="bg-gradient-to-br from-green-500/90 to-blue-600/90 text-white flex items-center justify-center shadow-2xl text-2xl font-bold rounded-full min-w-[180px] min-h-[120px] max-w-[260px] px-8 py-8 transition-all duration-200 border-4 border-transparent hover:border-blue-400 hover:scale-105 hover:shadow-blue-400/30 text-center select-none"
                        >
                          <span className="w-full break-words leading-tight flex items-center justify-center h-full">{bubble.text}</span>
                        </div>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity duration-200 bg-red-500/80 hover:bg-red-600/90 rounded-full p-1 shadow-md border-2 border-white"
                          style={{ pointerEvents: 'auto' }}
                          onClick={() => deleteBubble(bubble.id)}
                          tabIndex={-1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                <style jsx>{`
                  @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                  }
                `}</style>
              </CardContent>
            </Card>
          </TabsContent>

          <div className="w-full flex items-center my-8">
            <div className="flex-grow border-t border-blue-900/30"></div>
          </div>
          <TabsContent value="charts">
            <Card className="bg-[#181c24] border border-blue-900/40 mb-8 shadow-xl p-2 md:p-6 animate-fade-in-section">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-5 w-5 text-blue-300" aria-label="Visualize your data with pie and bar charts." />
                <span className="text-blue-200/80 text-sm">Charts</span>
              </div>
              <CardHeader>
                <CardTitle className="text-white">Charts</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={addChartItem} className="space-y-4 mb-4">
                  <div>
                    <Label htmlFor="itemName" className="text-white">
                      Item Name
                    </Label>
                    <Input
                      id="itemName"
                      value={newChartItem.name}
                      onChange={(e) => setNewChartItem({ ...newChartItem, name: e.target.value })}
                      className="bg-[#1A1A1B] border-gray-700 text-white"
                      placeholder="Enter item name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="itemValue" className="text-white">
                      Item Value
                    </Label>
                    <Input
                      id="itemValue"
                      type="number"
                      value={newChartItem.value}
                      onChange={(e) => setNewChartItem({ ...newChartItem, value: Number(e.target.value) })}
                      className="bg-[#1A1A1B] border-gray-700 text-white"
                      placeholder="Enter item value"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Add Chart Item
                  </Button>
                </form>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ChartCard title="Pie Chart">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartCard>
                  <ChartCard title="Bar Chart">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#1A1A1B", border: "none" }}
                          labelStyle={{ color: "white" }}
                        />
                        <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-bar-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <div className="w-full flex items-center my-8">
            <div className="flex-grow border-t border-blue-900/30"></div>
          </div>
          <TabsContent value="mindmap">
            <Card className="bg-[#181c24] border border-blue-900/40 mb-8 shadow-xl p-2 md:p-6 animate-fade-in-section">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-5 w-5 text-blue-300" aria-label="Branch out your ideas in a mind map structure." />
                <span className="text-blue-200/80 text-sm">Mind Map</span>
              </div>
              <CardHeader>
                <CardTitle className="text-white">Mind Map</CardTitle>
              </CardHeader>
              <CardContent>
                {renderMindMap(mindMap)}
              </CardContent>
            </Card>
          </TabsContent>

          <div className="w-full flex items-center my-8">
            <div className="flex-grow border-t border-blue-900/30"></div>
          </div>
          <TabsContent value="fishbone">
            <Card className="bg-[#181c24] border border-blue-900/40 mb-8 shadow-xl p-2 md:p-6 animate-fade-in-section">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-5 w-5 text-blue-300" aria-label="Analyze causes and effects with a fishbone diagram." />
                <span className="text-blue-200/80 text-sm">Fishbone</span>
              </div>
              <CardHeader>
                <CardTitle className="text-white">Fishbone</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Fishbone content */}
              </CardContent>
            </Card>
          </TabsContent>

          <div className="w-full flex items-center my-8">
            <div className="flex-grow border-t border-blue-900/30"></div>
          </div>
          <TabsContent value="sixhats">
            <Card className="bg-[#181c24] border border-blue-900/40 mb-8 shadow-xl p-2 md:p-6 animate-fade-in-section">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-5 w-5 text-blue-300" aria-label="Explore perspectives with the Six Thinking Hats method." />
                <span className="text-blue-200/80 text-sm">Six Hats</span>
              </div>
              <CardHeader>
                <CardTitle className="text-white">Six Hats</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Six Hats content */}
              </CardContent>
            </Card>
          </TabsContent>

          <div className="w-full flex items-center my-8">
            <div className="flex-grow border-t border-blue-900/30"></div>
          </div>
          <TabsContent value="swot">
            <Card className="bg-[#181c24] border border-blue-900/40 mb-8 shadow-xl p-2 md:p-6 animate-fade-in-section">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-5 w-5 text-blue-300" aria-label="Identify strengths, weaknesses, opportunities, and threats." />
                <span className="text-blue-200/80 text-sm">SWOT</span>
              </div>
              <CardHeader>
                <CardTitle className="text-white">SWOT</CardTitle>
              </CardHeader>
              <CardContent>
                {/* SWOT content */}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}