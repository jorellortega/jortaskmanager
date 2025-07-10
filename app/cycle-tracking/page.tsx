"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, CalendarDays, Plus, Trash2, Edit, Save, X } from "lucide-react"
import Link from "next/link"
import { format, addDays, subDays, differenceInDays, isSameDay, startOfDay } from "date-fns"
import { supabase } from "@/lib/supabaseClient"

interface CycleEntry {
  id: string
  user_id: string
  start_date: string
  end_date?: string
  flow_intensity: "light" | "medium" | "heavy"
  symptoms: string[]
  notes?: string
  created_at: string
}

interface SymptomLog {
  id: string
  user_id: string
  date: string
  symptoms: string[]
  mood: string
  notes?: string
  created_at: string
}

const flowIntensities = [
  { value: "light", label: "Light", color: "bg-blue-500" },
  { value: "medium", label: "Medium", color: "bg-pink-500" },
  { value: "heavy", label: "Heavy", color: "bg-red-500" }
]

const commonSymptoms = [
  "Cramps", "Bloating", "Fatigue", "Mood swings", "Headache", 
  "Back pain", "Breast tenderness", "Acne", "Food cravings", 
  "Insomnia", "Hot flashes", "Nausea", "Dizziness"
]

const moodOptions = [
  "Happy", "Calm", "Anxious", "Irritable", "Energetic", 
  "Tired", "Stressed", "Relaxed", "Sad", "Excited"
]

export default function CycleTrackingPage() {
  const [cycleEntries, setCycleEntries] = useState<CycleEntry[]>([])
  const [symptomLogs, setSymptomLogs] = useState<SymptomLog[]>([])
  // Use the same logic as /appointments for today
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  // Set selectedDate to today (parsed from todayStr) on mount
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date(todayStr + 'T00:00:00'));
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  
  // New cycle entry form
  const [newCycle, setNewCycle] = useState({
    start_date: "",
    end_date: "",
    flow_intensity: "medium" as "light" | "medium" | "heavy",
    symptoms: [] as string[],
    notes: ""
  })
  
  // Symptom log form
  const [newSymptomLog, setNewSymptomLog] = useState({
    date: "",
    symptoms: [] as string[],
    mood: "",
    notes: ""
  })
  
  // Editing states
  const [editingCycle, setEditingCycle] = useState<string | null>(null)
  const [editingSymptom, setEditingSymptom] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setError("You must be logged in to view cycle tracking data.")
        setLoading(false)
        return
      }
      setUserId(user.id)
      
      // Fetch cycle entries
      const { data: cycleData, error: cycleError } = await supabase
        .from("cycle_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("start_date", { ascending: false })
      
      if (cycleError) {
        setError("Failed to fetch cycle entries.")
      } else {
        setCycleEntries(cycleData || [])
      }
      
      // Fetch symptom logs
      const { data: symptomData, error: symptomError } = await supabase
        .from("symptom_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
      
      if (symptomError) {
        setError("Failed to fetch symptom logs.")
      } else {
        setSymptomLogs(symptomData || [])
      }
      
      setLoading(false)
    }
    fetchData()
  }, [])

  const addCycleEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!userId) {
      setError("You must be logged in to add cycle entries.")
      return
    }
    if (!newCycle.start_date) {
      setError("Please select a start date.")
      return
    }
    
    setLoading(true)
    const { data, error: insertError } = await supabase
      .from("cycle_entries")
      .insert([{
        user_id: userId,
        start_date: newCycle.start_date,
        end_date: newCycle.end_date || null,
        flow_intensity: newCycle.flow_intensity,
        symptoms: newCycle.symptoms,
        notes: newCycle.notes || null
      }])
      .select()
    
    if (insertError) {
      setError(insertError.message || "Failed to add cycle entry.")
    } else if (data && data.length > 0) {
      setCycleEntries(prev => [data[0], ...prev])
      setNewCycle({
        start_date: "",
        end_date: "",
        flow_intensity: "medium",
        symptoms: [],
        notes: ""
      })
    }
    setLoading(false)
  }

  const addSymptomLog = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!userId) {
      setError("You must be logged in to add symptom logs.")
      return
    }
    if (!newSymptomLog.date) {
      setError("Please select a date.")
      return
    }
    
    setLoading(true)
    const { data, error: insertError } = await supabase
      .from("symptom_logs")
      .insert([{
        user_id: userId,
        date: newSymptomLog.date,
        symptoms: newSymptomLog.symptoms,
        mood: newSymptomLog.mood,
        notes: newSymptomLog.notes || null
      }])
      .select()
    
    if (insertError) {
      setError(insertError.message || "Failed to add symptom log.")
    } else if (data && data.length > 0) {
      setSymptomLogs(prev => [data[0], ...prev])
      setNewSymptomLog({
        date: "",
        symptoms: [],
        mood: "",
        notes: ""
      })
    }
    setLoading(false)
  }

  const deleteCycleEntry = async (id: string) => {
    setError(null)
    setLoading(true)
    const { error: deleteError } = await supabase
      .from("cycle_entries")
      .delete()
      .eq("id", id)
    
    if (deleteError) {
      setError(deleteError.message || "Failed to delete cycle entry.")
    } else {
      setCycleEntries(prev => prev.filter(entry => entry.id !== id))
    }
    setLoading(false)
  }

  const deleteSymptomLog = async (id: string) => {
    setError(null)
    setLoading(true)
    const { error: deleteError } = await supabase
      .from("symptom_logs")
      .delete()
      .eq("id", id)
    
    if (deleteError) {
      setError(deleteError.message || "Failed to delete symptom log.")
    } else {
      setSymptomLogs(prev => prev.filter(log => log.id !== id))
    }
    setLoading(false)
  }

  const toggleSymptom = (symptom: string, symptoms: string[], setSymptoms: (symptoms: string[]) => void) => {
    if (symptoms.includes(symptom)) {
      setSymptoms(symptoms.filter(s => s !== symptom))
    } else {
      setSymptoms([...symptoms, symptom])
    }
  }

  const getCycleLength = (entries: CycleEntry[]) => {
    if (entries.length < 2) return null
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    )
    const lengths = []
    for (let i = 1; i < sortedEntries.length; i++) {
      const days = differenceInDays(
        new Date(sortedEntries[i].start_date),
        new Date(sortedEntries[i-1].start_date)
      )
      lengths.push(days)
    }
    const avgLength = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length)
    return avgLength
  }

  const predictNextPeriod = (entries: CycleEntry[]) => {
    const avgLength = getCycleLength(entries)
    if (!avgLength || entries.length === 0) return null
    
    const lastEntry = entries[0] // Most recent entry
    return addDays(new Date(lastEntry.start_date), avgLength)
  }

  const getCalendarDayClass = (date: Date): string => {
    const dateStr = format(date, "yyyy-MM-dd")
    
    // Check if it's a cycle start date
    const cycleStart = cycleEntries.find(entry => entry.start_date === dateStr)
    if (cycleStart) {
      return "bg-red-500 text-white rounded-full"
    }
    
    // Check if it's a symptom log date
    const symptomLog = symptomLogs.find(log => log.date === dateStr)
    if (symptomLog) {
      return "bg-pink-300 text-black rounded-full"
    }
    
    // Check if it's predicted next period
    const predictedDate = predictNextPeriod(cycleEntries)
    if (predictedDate && isSameDay(date, predictedDate)) {
      return "bg-purple-300 text-black rounded-full border-2 border-purple-500"
    }
    
    return ""
  }

  const avgCycleLength = getCycleLength(cycleEntries)
  const nextPredictedPeriod = predictNextPeriod(cycleEntries)

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
    <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white">
      <Link href="/dashboard" className="flex items-center text-blue-500 hover:text-blue-400 mb-4">
        <ArrowLeft className="mr-2" /> Back to Dashboard
      </Link>
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Cycle Tracking</h1>
        <p className="text-gray-400">Track your menstrual cycle, symptoms, and patterns</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-[#141415] border border-gray-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-pink-400">
              {cycleEntries.length}
            </div>
            <div className="text-sm text-gray-400">Total Cycles</div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#141415] border border-gray-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">
              {avgCycleLength ? `${avgCycleLength} days` : "N/A"}
            </div>
            <div className="text-sm text-gray-400">Average Cycle Length</div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#141415] border border-gray-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-400">
              {nextPredictedPeriod ? format(nextPredictedPeriod, "MMM dd") : "N/A"}
            </div>
            <div className="text-sm text-gray-400">Next Predicted Period</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-[#141415] text-white">
          <TabsTrigger value="calendar" className="data-[state=active]:bg-[#1A1A1B] data-[state=active]:text-white text-gray-300 hover:text-white">
            Calendar
          </TabsTrigger>
          <TabsTrigger value="cycles" className="data-[state=active]:bg-[#1A1A1B] data-[state=active]:text-white text-gray-300 hover:text-white">
            Cycles
          </TabsTrigger>
          <TabsTrigger value="symptoms" className="data-[state=active]:bg-[#1A1A1B] data-[state=active]:text-white text-gray-300 hover:text-white">
            Symptoms
          </TabsTrigger>
          <TabsTrigger value="add" className="data-[state=active]:bg-[#1A1A1B] data-[state=active]:text-white text-gray-300 hover:text-white">
            Add Entry
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-6">
          <Card className="bg-[#141415] border border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Cycle Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-2/3">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-md border border-gray-700 bg-[#141415] text-white"
                    classNames={{
                      months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                      month: "space-y-4",
                      caption: "flex justify-center pt-1 relative items-center",
                      caption_label: "text-sm font-medium text-white",
                      nav: "space-x-1 flex items-center",
                      nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-white border-gray-600",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex",
                      head_cell: "text-white rounded-md w-9 font-normal text-[0.8rem]",
                      row: "flex w-full mt-2",
                      cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                      day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 text-white hover:bg-gray-700 rounded-md",
                      day_range_end: "day-range-end",
                      day_selected: "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white",
                      day_today: "bg-gray-700 text-white",
                      day_outside: "text-gray-500 aria-selected:bg-accent/50 aria-selected:text-gray-500",
                      day_disabled: "text-gray-500 opacity-50",
                      day_range_middle: "aria-selected:bg-gray-700 aria-selected:text-white",
                      day_hidden: "invisible",
                    }}
                  />
                </div>
                <div className="w-full md:w-1/3">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-white">Period Start</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-pink-300 rounded-full"></div>
                      <span className="text-sm text-white">Symptom Log</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-purple-300 rounded-full border-2 border-purple-500"></div>
                      <span className="text-sm text-white">Predicted Period</span>
                    </div>
                    
                    <div className="mt-6 p-4 bg-[#1A1A1B] rounded-lg text-white">
                      <h3 className="font-semibold mb-2">Selected Date: {format(selectedDate, "MMMM dd, yyyy")}</h3>
                      {cycleEntries.find(entry => entry.start_date === format(selectedDate, "yyyy-MM-dd")) && (
                        <div className="text-sm text-green-400 mb-2">✓ Period started on this date</div>
                      )}
                      {symptomLogs.find(log => log.date === format(selectedDate, "yyyy-MM-dd")) && (
                        <div className="text-sm text-blue-400 mb-2">✓ Symptom log recorded</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cycles" className="mt-6">
          <Card className="bg-[#141415] border border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Cycle History</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : cycleEntries.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No cycle entries yet. Add your first entry to start tracking.
                </div>
              ) : (
                <div className="space-y-4">
                  {cycleEntries.map((entry) => (
                    <div key={entry.id} className="p-4 bg-[#1A1A1B] rounded-lg border border-gray-700">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">
                              {format(new Date(entry.start_date), "MMMM dd, yyyy")}
                            </span>
                            <Badge className={`${flowIntensities.find(f => f.value === entry.flow_intensity)?.color} text-white`}>
                              {entry.flow_intensity}
                            </Badge>
                          </div>
                          {entry.end_date && (
                            <div className="text-sm text-gray-400 mb-2">
                              Duration: {differenceInDays(new Date(entry.end_date), new Date(entry.start_date)) + 1} days
                            </div>
                          )}
                          {entry.symptoms.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {entry.symptoms.map((symptom) => (
                                <Badge key={symptom} variant="outline" className="text-xs text-white border-white">
                                  {symptom}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {entry.notes && (
                            <div className="text-sm text-gray-300">{entry.notes}</div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCycleEntry(entry.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="symptoms" className="mt-6">
          <Card className="bg-[#141415] border border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Symptom Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : symptomLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No symptom logs yet. Add your first log to start tracking symptoms.
                </div>
              ) : (
                <div className="space-y-4">
                  {symptomLogs.map((log) => (
                    <div key={log.id} className="p-4 bg-[#1A1A1B] rounded-lg border border-gray-700">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">
                              {format(new Date(log.date), "MMMM dd, yyyy")}
                            </span>
                            {log.mood && (
                                                          <Badge variant="outline" className="text-xs text-white border-white">
                              {log.mood}
                            </Badge>
                            )}
                          </div>
                          {log.symptoms.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {log.symptoms.map((symptom) => (
                                <Badge key={symptom} variant="outline" className="text-xs text-white border-white">
                                  {symptom}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {log.notes && (
                            <div className="text-sm text-gray-300">{log.notes}</div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSymptomLog(log.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Add Cycle Entry */}
            <Card className="bg-[#141415] border border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Add Cycle Entry</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={addCycleEntry} className="space-y-4">
                  <div>
                    <Label htmlFor="start_date" className="text-white">Start Date *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={newCycle.start_date}
                      onChange={(e) => setNewCycle(prev => ({ ...prev, start_date: e.target.value }))}
                      className="bg-[#1A1A1B] border-gray-700 text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="end_date" className="text-white">End Date (Optional)</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={newCycle.end_date}
                      onChange={(e) => setNewCycle(prev => ({ ...prev, end_date: e.target.value }))}
                      className="bg-[#1A1A1B] border-gray-700 text-white"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="flow_intensity" className="text-white">Flow Intensity</Label>
                    <Select
                      value={newCycle.flow_intensity}
                      onValueChange={(value: "light" | "medium" | "heavy") => 
                        setNewCycle(prev => ({ ...prev, flow_intensity: value }))
                      }
                    >
                      <SelectTrigger className="bg-[#1A1A1B] border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1A1B] border-gray-700">
                        {flowIntensities.map((intensity) => (
                          <SelectItem key={intensity.value} value={intensity.value} className="text-white hover:bg-gray-700">
                            {intensity.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-white">Symptoms</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {commonSymptoms.map((symptom) => (
                        <div key={symptom} className="flex items-center space-x-2">
                          <Checkbox
                            id={`cycle-${symptom}`}
                            checked={newCycle.symptoms.includes(symptom)}
                            onCheckedChange={() => toggleSymptom(symptom, newCycle.symptoms, 
                              (symptoms) => setNewCycle(prev => ({ ...prev, symptoms }))
                            )}
                          />
                          <Label htmlFor={`cycle-${symptom}`} className="text-sm text-white">{symptom}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="cycle_notes" className="text-white">Notes</Label>
                    <Textarea
                      id="cycle_notes"
                      value={newCycle.notes}
                      onChange={(e) => setNewCycle(prev => ({ ...prev, notes: e.target.value }))}
                      className="bg-[#1A1A1B] border-gray-700 text-white"
                      placeholder="Any additional notes..."
                    />
                  </div>
                  
                  <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700">
                    Add Cycle Entry
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Add Symptom Log */}
            <Card className="bg-[#141415] border border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Add Symptom Log</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={addSymptomLog} className="space-y-4">
                  <div>
                    <Label htmlFor="symptom_date" className="text-white">Date *</Label>
                    <Input
                      id="symptom_date"
                      type="date"
                      value={newSymptomLog.date}
                      onChange={(e) => setNewSymptomLog(prev => ({ ...prev, date: e.target.value }))}
                      className="bg-[#1A1A1B] border-gray-700 text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="mood" className="text-white">Mood</Label>
                    <Select
                      value={newSymptomLog.mood}
                      onValueChange={(value) => setNewSymptomLog(prev => ({ ...prev, mood: value }))}
                    >
                      <SelectTrigger className="bg-[#1A1A1B] border-gray-700 text-white">
                        <SelectValue placeholder="Select mood" className="text-white" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1A1B] border-gray-700">
                        {moodOptions.map((mood) => (
                          <SelectItem key={mood} value={mood} className="text-white hover:bg-gray-700">
                            {mood}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-white">Symptoms</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {commonSymptoms.map((symptom) => (
                        <div key={symptom} className="flex items-center space-x-2">
                          <Checkbox
                            id={`symptom-${symptom}`}
                            checked={newSymptomLog.symptoms.includes(symptom)}
                            onCheckedChange={() => toggleSymptom(symptom, newSymptomLog.symptoms, 
                              (symptoms) => setNewSymptomLog(prev => ({ ...prev, symptoms }))
                            )}
                          />
                          <Label htmlFor={`symptom-${symptom}`} className="text-sm text-white">{symptom}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="symptom_notes" className="text-white">Notes</Label>
                    <Textarea
                      id="symptom_notes"
                      value={newSymptomLog.notes}
                      onChange={(e) => setNewSymptomLog(prev => ({ ...prev, notes: e.target.value }))}
                      className="bg-[#1A1A1B] border-gray-700 text-white"
                      placeholder="Any additional notes..."
                    />
                  </div>
                  
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                    Add Symptom Log
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 