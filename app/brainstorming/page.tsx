"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Trash2 } from "lucide-react"
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
  const [newSwotItem, setNewSwotItem] = useState({ category: "strengths" as const, text: "" })

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
    <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white">
      <Link href="/dashboard" className="flex items-center text-blue-500 hover:text-blue-400 mb-4">
        <ArrowLeft className="mr-2" /> Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold mb-4">Brainstorming Tools</h1>

      <Tabs defaultValue="bubblemap" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 bg-[#1A1A1B]">
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

        <TabsContent value="bubblemap">
          <Card className="bg-[#141415] border border-gray-700 mb-4">
            <CardHeader>
              <CardTitle className="text-white">Bubble Map</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addBubble} className="space-y-4 mb-4">
                <div>
                  <Label htmlFor="newBubble" className="text-white">
                    New Idea
                  </Label>
                  <Input
                    id="newBubble"
                    value={newBubble}
                    onChange={(e) => setNewBubble(e.target.value)}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Enter a new idea"
                  />
                </div>
                <Button type="submit" className="w-full">
                  Add Bubble
                </Button>
              </form>
              <div className="flex flex-wrap gap-4">
                {bubbles.map((bubble) => (
                  <div
                    key={bubble.id}
                    className="bg-[#1A1A1B] p-4 rounded-full flex items-center justify-center relative"
                  >
                    <span>{bubble.text}</span>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2"
                      onClick={() => deleteBubble(bubble.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts">
          <Card className="bg-[#141415] border border-gray-700 mb-4">
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
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mindmap">
          <Card className="bg-[#141415] border border-gray-700 mb-4">
            <CardHeader>
              <CardTitle className="text-white">Mind Map</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addMindMapItem} className="space-y-4 mb-4">
                <div>
                  <Label htmlFor="newMindMapItem" className="text-white">
                    New Idea
                  </Label>
                  <Input
                    id="newMindMapItem"
                    value={newMindMapItem}
                    onChange={(e) => setNewMindMapItem(e.target.value)}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Enter a new idea"
                  />
                </div>
                <Button type="submit" className="w-full">
                  Add to Mind Map
                </Button>
              </form>
              <div className="mt-4">{renderMindMap(mindMap)}</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fishbone">
          <Card className="bg-[#141415] border border-gray-700 mb-4">
            <CardHeader>
              <CardTitle className="text-white">Fishbone Diagram</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addFishboneItem} className="space-y-4 mb-4">
                <div>
                  <Label htmlFor="fishboneCategory" className="text-white">
                    Category
                  </Label>
                  <Input
                    id="fishboneCategory"
                    value={newFishboneItem.category}
                    onChange={(e) => setNewFishboneItem({ ...newFishboneItem, category: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Enter category"
                  />
                </div>
                <div>
                  <Label htmlFor="fishboneCause" className="text-white">
                    Cause
                  </Label>
                  <Input
                    id="fishboneCause"
                    value={newFishboneItem.cause}
                    onChange={(e) => setNewFishboneItem({ ...newFishboneItem, cause: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Enter cause"
                  />
                </div>
                <Button type="submit" className="w-full">
                  Add Fishbone Item
                </Button>
              </form>
              <div className="mt-4">
                {fishboneItems.map((item) => (
                  <div key={item.id} className="mb-2 p-2 bg-[#1A1A1B] rounded">
                    <strong>{item.category}:</strong> {item.cause}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sixhats">
          <Card className="bg-[#141415] border border-gray-700 mb-4">
            <CardHeader>
              <CardTitle className="text-white">Six Thinking Hats</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addSixHatsThought} className="space-y-4 mb-4">
                <div>
                  <Label htmlFor="sixHatsColor" className="text-white">
                    Hat Color
                  </Label>
                  <Select onValueChange={(value) => setNewSixHatsThought({ ...newSixHatsThought, hat: value })}>
                    <SelectTrigger className="bg-[#1A1A1B] border-gray-700 text-white">
                      <SelectValue placeholder="Select a hat color" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="white">White (Facts)</SelectItem>
                      <SelectItem value="red">Red (Emotions)</SelectItem>
                      <SelectItem value="black">Black (Caution)</SelectItem>
                      <SelectItem value="yellow">Yellow (Benefits)</SelectItem>
                      <SelectItem value="green">Green (Creativity)</SelectItem>
                      <SelectItem value="blue">Blue (Process)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sixHatsThought" className="text-white">
                    Thought
                  </Label>
                  <Textarea
                    id="sixHatsThought"
                    value={newSixHatsThought.thought}
                    onChange={(e) => setNewSixHatsThought({ ...newSixHatsThought, thought: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Enter your thought"
                  />
                </div>
                <Button type="submit" className="w-full">
                  Add Thought
                </Button>
              </form>
              <div className="mt-4">
                {sixHatsThoughts.map((thought) => (
                  <div
                    key={thought.id}
                    className={`mb-2 p-2 rounded ${
                      thought.hat === "white"
                        ? "bg-gray-200 text-black"
                        : thought.hat === "red"
                          ? "bg-red-500"
                          : thought.hat === "black"
                            ? "bg-black"
                            : thought.hat === "yellow"
                              ? "bg-yellow-400 text-black"
                              : thought.hat === "green"
                                ? "bg-green-500"
                                : "bg-blue-500"
                    }`}
                  >
                    <strong>{thought.hat.charAt(0).toUpperCase() + thought.hat.slice(1)} Hat:</strong> {thought.thought}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="swot">
          <Card className="bg-[#141415] border border-gray-700 mb-4">
            <CardHeader>
              <CardTitle className="text-white">SWOT Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addSwotItem} className="space-y-4 mb-4">
                <div>
                  <Label htmlFor="swotCategory" className="text-white">
                    Category
                  </Label>
                  <Select
                    onValueChange={(value: "strengths" | "weaknesses" | "opportunities" | "threats") =>
                      setNewSwotItem({ ...newSwotItem, category: value })
                    }
                  >
                    <SelectTrigger className="bg-[#1A1A1B] border-gray-700 text-white">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strengths">Strengths</SelectItem>
                      <SelectItem value="weaknesses">Weaknesses</SelectItem>
                      <SelectItem value="opportunities">Opportunities</SelectItem>
                      <SelectItem value="threats">Threats</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="swotText" className="text-white">
                    Item
                  </Label>
                  <Input
                    id="swotText"
                    value={newSwotItem.text}
                    onChange={(e) => setNewSwotItem({ ...newSwotItem, text: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Enter SWOT item"
                  />
                </div>
                <Button type="submit" className="w-full">
                  Add SWOT Item
                </Button>
              </form>
              <div className="mt-4 grid grid-cols-2 gap-4">
                {(["strengths", "weaknesses", "opportunities", "threats"] as const).map((category) => (
                  <div
                    key={category}
                    className={`p-2 rounded ${
                      category === "strengths"
                        ? "bg-green-700"
                        : category === "weaknesses"
                          ? "bg-red-700"
                          : category === "opportunities"
                            ? "bg-blue-700"
                            : "bg-yellow-700"
                    }`}
                  >
                    <h3 className="font-bold mb-2">{category.charAt(0).toUpperCase() + category.slice(1)}</h3>
                    <ul className="list-disc list-inside">
                      {swotItems
                        .filter((item) => item.category === category)
                        .map((item) => (
                          <li key={item.id}>{item.text}</li>
                        ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

