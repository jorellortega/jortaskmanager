"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Plus, Trash2, Edit2, Check, X, Calendar, Heart, Baby, Clock, Target, BookOpen, AlertCircle, Info } from "lucide-react"
import Link from "next/link"
import { format, parseISO, addDays, differenceInDays, addWeeks, addMonths } from "date-fns"
import { supabase } from "@/lib/supabaseClient"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

type PregnancyInfo = {
  id: string
  user_id: string
  due_date: string
  conception_date?: string
  trimester: number
  weeks_pregnant: number
  days_pregnant: number
  notes?: string
  created_at?: string
}

type PregnancySymptom = {
  id: string
  user_id: string
  symptom: string
  severity: "mild" | "moderate" | "severe"
  date: string
  notes?: string
  created_at?: string
}

type PregnancyAppointment = {
  id: string
  user_id: string
  title: string
  date: string
  time: string
  type: string
  doctor?: string
  location?: string
  notes?: string
  completed: boolean
  created_at?: string
}

type PregnancyMilestone = {
  id: string
  user_id: string
  title: string
  date: string
  description?: string
  completed: boolean
  created_at?: string
}

const pregnancyMilestones = [
  { week: 4, title: "Positive pregnancy test", description: "First signs of pregnancy" },
  { week: 6, title: "First heartbeat", description: "Baby's heart begins to beat" },
  { week: 8, title: "Major organs form", description: "Critical development period" },
  { week: 12, title: "End of first trimester", description: "Risk of miscarriage decreases" },
  { week: 16, title: "Gender can be determined", description: "Ultrasound may reveal baby's sex" },
  { week: 20, title: "Anatomy scan", description: "Detailed ultrasound examination" },
  { week: 24, title: "Viability milestone", description: "Baby has chance of survival if born" },
  { week: 28, title: "Third trimester begins", description: "Final stretch of pregnancy" },
  { week: 32, title: "Baby practices breathing", description: "Lungs continue developing" },
  { week: 36, title: "Baby is full-term soon", description: "Almost ready for birth" },
  { week: 40, title: "Due date", description: "Expected delivery date" }
]

const symptomTypes = [
  "Nausea/Morning Sickness", "Fatigue", "Food Cravings", "Food Aversions", "Breast Tenderness",
  "Frequent Urination", "Mood Swings", "Back Pain", "Swelling", "Heartburn", "Constipation",
  "Braxton Hicks Contractions", "Lightning Crotch", "Nesting Instinct", "Other"
]

const appointmentTypes = [
  "Prenatal Checkup", "Ultrasound", "Blood Test", "Glucose Test", "Genetic Testing",
  "Childbirth Class", "Hospital Tour", "Specialist Consultation", "Other"
]

export default function PregnancyTrackingPage() {
  const [pregnancyInfo, setPregnancyInfo] = useState<PregnancyInfo | null>(null)
  const [symptoms, setSymptoms] = useState<PregnancySymptom[]>([])
  const [appointments, setAppointments] = useState<PregnancyAppointment[]>([])
  const [milestones, setMilestones] = useState<PregnancyMilestone[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  
  // Form states
  const [showPregnancyForm, setShowPregnancyForm] = useState(false)
  const [newPregnancy, setNewPregnancy] = useState({ due_date: "", conception_date: "", notes: "" })
  const [showSymptomForm, setShowSymptomForm] = useState(false)
  const [newSymptom, setNewSymptom] = useState({ symptom: "", severity: "mild" as const, date: "", notes: "" })
  const [showAppointmentForm, setShowAppointmentForm] = useState(false)
  const [newAppointment, setNewAppointment] = useState({ title: "", date: "", time: "", type: "", doctor: "", location: "", notes: "" })
  const [showMilestoneForm, setShowMilestoneForm] = useState(false)
  const [newMilestone, setNewMilestone] = useState({ title: "", date: "", description: "" })

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editType, setEditType] = useState<"symptom" | "appointment" | "milestone" | null>(null)
  const [editData, setEditData] = useState<any>({})
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null)
  const [editMilestoneData, setEditMilestoneData] = useState({ title: "", date: "", description: "" })

  useEffect(() => {
    const getUserAndData = async () => {
      setLoading(true)
      setError(null)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setError("You must be logged in to view pregnancy tracking data.")
        setLoading(false)
        return
      }
      setUserId(user.id)
      
      // Fetch all pregnancy-related data
      await Promise.all([
        fetchPregnancyInfo(user.id),
        fetchSymptoms(user.id),
        fetchAppointments(user.id),
        fetchMilestones(user.id)
      ])
      
      setLoading(false)
    }
    getUserAndData()
  }, [])

  const fetchPregnancyInfo = async (uid: string) => {
    const { data, error } = await supabase
      .from("pregnancy_info")
      .select("*")
      .eq("user_id", uid)
      .single()
    if (!error && data) {
      setPregnancyInfo(data)
    }
  }

  const fetchSymptoms = async (uid: string) => {
    const { data, error } = await supabase
      .from("pregnancy_symptoms")
      .select("*")
      .eq("user_id", uid)
      .order("date", { ascending: false })
    if (!error) {
      setSymptoms(data || [])
    }
  }

  const fetchAppointments = async (uid: string) => {
    const { data, error } = await supabase
      .from("pregnancy_appointments")
      .select("*")
      .eq("user_id", uid)
      .order("date", { ascending: true })
    if (!error) {
      setAppointments(data || [])
    }
  }

  const fetchMilestones = async (uid: string) => {
    const { data, error } = await supabase
      .from("pregnancy_milestones")
      .select("*")
      .eq("user_id", uid)
      .order("date", { ascending: true })
    if (!error) {
      setMilestones(data || [])
    }
  }

  const calculatePregnancyProgress = (dueDate: string) => {
    const due = parseISO(dueDate)
    const today = new Date()
    const daysUntilDue = differenceInDays(due, today)
    const daysPregnant = 280 - daysUntilDue // 40 weeks = 280 days
    const weeksPregnant = Math.floor(daysPregnant / 7)
    const trimester = weeksPregnant <= 12 ? 1 : weeksPregnant <= 27 ? 2 : 3
    
    return { daysPregnant, weeksPregnant, trimester }
  }

  const addPregnancyInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !newPregnancy.due_date) return
    
    setLoading(true)
    const { daysPregnant, weeksPregnant, trimester } = calculatePregnancyProgress(newPregnancy.due_date)
    
    const { data, error } = await supabase
      .from("pregnancy_info")
      .insert([{
        user_id: userId,
        due_date: newPregnancy.due_date,
        conception_date: newPregnancy.conception_date || null,
        trimester,
        weeks_pregnant: weeksPregnant,
        days_pregnant: daysPregnant,
        notes: newPregnancy.notes || null
      }])
      .select()
      .single()
    
    if (error) {
      setError("Failed to add pregnancy info.")
    } else {
      setPregnancyInfo(data)
      setShowPregnancyForm(false)
      setNewPregnancy({ due_date: "", conception_date: "", notes: "" })
    }
    setLoading(false)
  }

  const addSymptom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !newSymptom.symptom || !newSymptom.date) return
    
    setLoading(true)
    const { data, error } = await supabase
      .from("pregnancy_symptoms")
      .insert([{
        user_id: userId,
        symptom: newSymptom.symptom,
        severity: newSymptom.severity,
        date: newSymptom.date,
        notes: newSymptom.notes || null
      }])
      .select()
    
    if (error) {
      setError("Failed to add symptom.")
    } else {
      setSymptoms(prev => [...prev, ...(data || [])])
      setShowSymptomForm(false)
      setNewSymptom({ symptom: "", severity: "mild", date: "", notes: "" })
    }
    setLoading(false)
  }

  const addAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !newAppointment.title || !newAppointment.date) return
    
    setLoading(true)
    const { data, error } = await supabase
      .from("pregnancy_appointments")
      .insert([{
        user_id: userId,
        title: newAppointment.title,
        date: newAppointment.date,
        time: newAppointment.time || null,
        type: newAppointment.type || null,
        doctor: newAppointment.doctor || null,
        location: newAppointment.location || null,
        notes: newAppointment.notes || null,
        completed: false
      }])
      .select()
    
    if (error) {
      setError("Failed to add appointment.")
    } else {
      setAppointments(prev => [...prev, ...(data || [])])
      setShowAppointmentForm(false)
      setNewAppointment({ title: "", date: "", time: "", type: "", doctor: "", location: "", notes: "" })
    }
    setLoading(false)
  }

  const addMilestone = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !newMilestone.title || !newMilestone.date) return
    
    setLoading(true)
    const { data, error } = await supabase
      .from("pregnancy_milestones")
      .insert([{
        user_id: userId,
        title: newMilestone.title,
        date: newMilestone.date,
        description: newMilestone.description || null,
        completed: false
      }])
      .select()
    
    if (error) {
      setError("Failed to add milestone.")
    } else {
      setMilestones(prev => [...prev, ...(data || [])])
      setShowMilestoneForm(false)
      setNewMilestone({ title: "", date: "", description: "" })
    }
    setLoading(false)
  }

  const toggleAppointment = async (id: string, completed: boolean) => {
    const { data, error } = await supabase
      .from("pregnancy_appointments")
      .update({ completed: !completed })
      .eq("id", id)
      .select()
    
    if (!error && data) {
      setAppointments(prev => prev.map(apt => apt.id === id ? data[0] : apt))
    }
  }

  const toggleMilestone = async (id: string, completed: boolean) => {
    const { data, error } = await supabase
      .from("pregnancy_milestones")
      .update({ completed: !completed })
      .eq("id", id)
      .select()
    
    if (!error && data) {
      setMilestones(prev => prev.map(mil => mil.id === id ? data[0] : mil))
    }
  }

  const startEditMilestone = (milestone: PregnancyMilestone) => {
    setEditingMilestoneId(milestone.id)
    setEditMilestoneData({
      title: milestone.title,
      date: milestone.date,
      description: milestone.description || ""
    })
  }

  const cancelEditMilestone = () => {
    setEditingMilestoneId(null)
    setEditMilestoneData({ title: "", date: "", description: "" })
  }

  const saveEditMilestone = async () => {
    if (!editingMilestoneId) return
    
    setLoading(true)
    const { data, error } = await supabase
      .from("pregnancy_milestones")
      .update({
        title: editMilestoneData.title,
        date: editMilestoneData.date,
        description: editMilestoneData.description || null
      })
      .eq("id", editingMilestoneId)
      .select()
    
    if (error) {
      setError("Failed to update milestone.")
    } else if (data && data.length > 0) {
      setMilestones(prev => prev.map(mil => mil.id === editingMilestoneId ? data[0] : mil))
      cancelEditMilestone()
    }
    setLoading(false)
  }

  const deleteItem = async (type: string, id: string) => {
    setLoading(true)
    let error
    switch (type) {
      case "symptom":
        error = (await supabase.from("pregnancy_symptoms").delete().eq("id", id)).error
        if (!error) setSymptoms(prev => prev.filter(s => s.id !== id))
        break
      case "appointment":
        error = (await supabase.from("pregnancy_appointments").delete().eq("id", id)).error
        if (!error) setAppointments(prev => prev.filter(a => a.id !== id))
        break
      case "milestone":
        error = (await supabase.from("pregnancy_milestones").delete().eq("id", id)).error
        if (!error) setMilestones(prev => prev.filter(m => m.id !== id))
        break
    }
    
    if (error) {
      setError("Failed to delete item.")
    }
    setLoading(false)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "mild": return "text-green-400 bg-green-900/20 border-green-500"
      case "moderate": return "text-yellow-400 bg-yellow-900/20 border-yellow-500"
      case "severe": return "text-red-400 bg-red-900/20 border-red-500"
      default: return "text-gray-400 bg-gray-900/20 border-gray-500"
    }
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>
  }

  return (
    <div className="container mx-auto p-4 text-white">
      <Link href="/dashboard" className="flex items-center text-blue-500 hover:text-blue-400 mb-4">
        <ArrowLeft className="mr-2" /> Back to Dashboard
      </Link>
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <Heart className="mr-3 text-pink-400" /> Pregnancy Tracking
      </h1>
      
      {/* Pregnancy Overview */}
      {!pregnancyInfo ? (
        <Card className="bg-[#141415] border border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Baby className="mr-2 h-5 w-5" /> Start Tracking Your Pregnancy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowPregnancyForm(true)} className="w-full">
              <Plus className="mr-2 h-4 w-4" /> Add Pregnancy Information
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-[#141415] border border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Baby className="mr-2 h-5 w-5" /> Pregnancy Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-[#1A1A1B] rounded-lg">
                <div className="text-2xl font-bold text-pink-400">{pregnancyInfo.weeks_pregnant}</div>
                <div className="text-sm text-gray-400">Weeks Pregnant</div>
              </div>
              <div className="text-center p-3 bg-[#1A1A1B] rounded-lg">
                <div className="text-2xl font-bold text-blue-400">{pregnancyInfo.trimester}</div>
                <div className="text-sm text-gray-400">Trimester</div>
              </div>
              <div className="text-center p-3 bg-[#1A1A1B] rounded-lg">
                <div className="text-2xl font-bold text-green-400">{pregnancyInfo.days_pregnant}</div>
                <div className="text-sm text-gray-400">Days Pregnant</div>
              </div>
              <div className="text-center p-3 bg-[#1A1A1B] rounded-lg">
                <div className="text-2xl font-bold text-purple-400">
                  {differenceInDays(parseISO(pregnancyInfo.due_date), new Date())}
                </div>
                <div className="text-sm text-gray-400">Days Until Due</div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-white mb-2">Due Date</div>
              <div className="text-2xl text-pink-400 font-bold">
                {format(parseISO(pregnancyInfo.due_date), "EEEE, MMMM d, yyyy")}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pregnancy Info Form */}
      {showPregnancyForm && (
        <Card className="bg-[#141415] border border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Add Pregnancy Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addPregnancyInfo} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="due_date" className="text-white">Due Date *</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={newPregnancy.due_date}
                    onChange={(e) => setNewPregnancy({ ...newPregnancy, due_date: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="conception_date" className="text-white">Conception Date (Optional)</Label>
                  <Input
                    id="conception_date"
                    type="date"
                    value={newPregnancy.conception_date}
                    onChange={(e) => setNewPregnancy({ ...newPregnancy, conception_date: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes" className="text-white">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={newPregnancy.notes}
                  onChange={(e) => setNewPregnancy({ ...newPregnancy, notes: e.target.value })}
                  className="bg-[#1A1A1B] border-gray-700 text-white"
                  placeholder="Any additional notes about your pregnancy..."
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Adding..." : "Add Pregnancy Info"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowPregnancyForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Symptoms Tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="bg-[#141415] border border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-yellow-400" /> Symptoms
            </CardTitle>
            <Button size="sm" onClick={() => setShowSymptomForm(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 max-h-64 overflow-y-auto">
            {symptoms.length === 0 ? (
              <p className="text-gray-500 text-sm italic">No symptoms tracked yet</p>
            ) : (
              symptoms.map((symptom) => (
                <div key={symptom.id} className="p-2 bg-[#1A1A1B] rounded border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-white font-medium">{symptom.symptom}</div>
                      <div className="text-sm text-gray-400">
                        {format(parseISO(symptom.date), "MMM d, yyyy")}
                        {symptom.notes && ` • ${symptom.notes}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded border ${getSeverityColor(symptom.severity)}`}>
                        {symptom.severity}
                      </span>
                      <Button size="sm" variant="ghost" onClick={() => deleteItem("symptom", symptom.id)}>
                        <Trash2 className="h-3 w-3 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Appointments */}
        <Card className="bg-[#141415] border border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-blue-400" /> Appointments
            </CardTitle>
            <Button size="sm" onClick={() => setShowAppointmentForm(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 max-h-64 overflow-y-auto">
            {appointments.length === 0 ? (
              <p className="text-gray-500 text-sm italic">No appointments scheduled</p>
            ) : (
              appointments.map((appointment) => (
                <div key={appointment.id} className="p-2 bg-[#1A1A1B] rounded border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-white font-medium">{appointment.title}</div>
                      <div className="text-sm text-gray-400">
                        {format(parseISO(appointment.date), "MMM d, yyyy")}
                        {appointment.time && ` • ${appointment.time}`}
                        {appointment.type && ` • ${appointment.type}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={appointment.completed}
                        onCheckedChange={() => toggleAppointment(appointment.id, appointment.completed)}
                      />
                      <Button size="sm" variant="ghost" onClick={() => deleteItem("appointment", appointment.id)}>
                        <Trash2 className="h-3 w-3 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Symptoms Form */}
      {showSymptomForm && (
        <Card className="bg-[#141415] border border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Add Symptom</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addSymptom} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="symptom" className="text-white">Symptom *</Label>
                  <Select value={newSymptom.symptom} onValueChange={(value) => setNewSymptom({ ...newSymptom, symptom: value })}>
                    <SelectTrigger className="bg-[#1A1A1B] border-gray-700 text-white">
                      <SelectValue placeholder="Select symptom" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#18181b] text-white">
                      {symptomTypes.map((type) => (
                        <SelectItem key={type} value={type} className="text-white">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="severity" className="text-white">Severity *</Label>
                  <Select value={newSymptom.severity} onValueChange={(value: "mild" | "moderate" | "severe") => setNewSymptom({ ...newSymptom, severity: value })}>
                    <SelectTrigger className="bg-[#1A1A1B] border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#18181b] text-white">
                      <SelectItem value="mild" className="text-white">Mild</SelectItem>
                      <SelectItem value="moderate" className="text-white">Moderate</SelectItem>
                      <SelectItem value="severe" className="text-white">Severe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="symptom_date" className="text-white">Date *</Label>
                  <Input
                    id="symptom_date"
                    type="date"
                    value={newSymptom.date}
                    onChange={(e) => setNewSymptom({ ...newSymptom, date: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="symptom_notes" className="text-white">Notes (Optional)</Label>
                  <Input
                    id="symptom_notes"
                    value={newSymptom.notes}
                    onChange={(e) => setNewSymptom({ ...newSymptom, notes: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Additional details..."
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Adding..." : "Add Symptom"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowSymptomForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Appointments Form */}
      {showAppointmentForm && (
        <Card className="bg-[#141415] border border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Add Appointment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addAppointment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="appointment_title" className="text-white">Title *</Label>
                  <Input
                    id="appointment_title"
                    value={newAppointment.title}
                    onChange={(e) => setNewAppointment({ ...newAppointment, title: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Appointment title"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="appointment_type" className="text-white">Type</Label>
                  <Select value={newAppointment.type} onValueChange={(value) => setNewAppointment({ ...newAppointment, type: value })}>
                    <SelectTrigger className="bg-[#1A1A1B] border-gray-700 text-white">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#18181b] text-white">
                      {appointmentTypes.map((type) => (
                        <SelectItem key={type} value={type} className="text-white">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="appointment_date" className="text-white">Date *</Label>
                  <Input
                    id="appointment_date"
                    type="date"
                    value={newAppointment.date}
                    onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="appointment_time" className="text-white">Time</Label>
                  <Input
                    id="appointment_time"
                    type="time"
                    value={newAppointment.time}
                    onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="appointment_doctor" className="text-white">Doctor</Label>
                  <Input
                    id="appointment_doctor"
                    value={newAppointment.doctor}
                    onChange={(e) => setNewAppointment({ ...newAppointment, doctor: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Doctor's name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="appointment_location" className="text-white">Location</Label>
                  <Input
                    id="appointment_location"
                    value={newAppointment.location}
                    onChange={(e) => setNewAppointment({ ...newAppointment, location: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Hospital/clinic name"
                  />
                </div>
                <div>
                  <Label htmlFor="appointment_notes" className="text-white">Notes</Label>
                  <Input
                    id="appointment_notes"
                    value={newAppointment.notes}
                    onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Adding..." : "Add Appointment"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAppointmentForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Pregnancy Milestones */}
      <Card className="bg-[#141415] border border-gray-700 mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center">
            <Target className="mr-2 h-5 w-5 text-green-400" /> Pregnancy Milestones
          </CardTitle>
          <Button size="sm" onClick={() => setShowMilestoneForm(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pregnancyMilestones.map((milestone) => {
              const isCompleted = milestones.some(m => m.title === milestone.title && m.completed)
              const isRelevant = pregnancyInfo && pregnancyInfo.weeks_pregnant >= milestone.week
              
              return (
                <div
                  key={milestone.week}
                  className={`p-3 rounded-lg border ${
                    isCompleted 
                      ? "bg-green-900/20 border-green-500" 
                      : isRelevant 
                        ? "bg-blue-900/20 border-blue-500" 
                        : "bg-gray-900/20 border-gray-600"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-gray-400">Week {milestone.week}</div>
                    {isCompleted && <Check className="h-4 w-4 text-green-400" />}
                  </div>
                  <div className="text-white font-medium mb-1">{milestone.title}</div>
                  <div className="text-sm text-gray-400">{milestone.description}</div>
                  {isRelevant && !isCompleted && (
                    <Button
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => {
                        setNewMilestone({ title: milestone.title, date: format(new Date(), "yyyy-MM-dd"), description: milestone.description })
                        setShowMilestoneForm(true)
                      }}
                    >
                      Mark Complete
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Custom Milestones Form */}
      {showMilestoneForm && (
        <Card className="bg-[#141415] border border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Add Custom Milestone</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addMilestone} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="milestone_title" className="text-white">Title *</Label>
                  <Input
                    id="milestone_title"
                    value={newMilestone.title}
                    onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    placeholder="Milestone title"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="milestone_date" className="text-white">Date *</Label>
                  <Input
                    id="milestone_date"
                    type="date"
                    value={newMilestone.date}
                    onChange={(e) => setNewMilestone({ ...newMilestone, date: e.target.value })}
                    className="bg-[#1A1A1B] border-gray-700 text-white"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="milestone_description" className="text-white">Description (Optional)</Label>
                <Textarea
                  id="milestone_description"
                  value={newMilestone.description}
                  onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                  className="bg-[#1A1A1B] border-gray-700 text-white"
                  placeholder="Describe this milestone..."
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Adding..." : "Add Milestone"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowMilestoneForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Custom Milestones List */}
      {milestones.length > 0 && (
        <Card className="bg-[#141415] border border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Your Custom Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {milestones.map((milestone) => (
                <div key={milestone.id} className="p-3 bg-[#1A1A1B] rounded border border-gray-700">
                  {editingMilestoneId === milestone.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor={`edit-title-${milestone.id}`} className="text-white text-sm">Title</Label>
                          <Input
                            id={`edit-title-${milestone.id}`}
                            value={editMilestoneData.title}
                            onChange={(e) => setEditMilestoneData({ ...editMilestoneData, title: e.target.value })}
                            className="bg-[#232325] border-gray-700 text-white text-sm"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor={`edit-date-${milestone.id}`} className="text-white text-sm">Date</Label>
                          <Input
                            id={`edit-date-${milestone.id}`}
                            type="date"
                            value={editMilestoneData.date}
                            onChange={(e) => setEditMilestoneData({ ...editMilestoneData, date: e.target.value })}
                            className="bg-[#232325] border-gray-700 text-white text-sm"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor={`edit-description-${milestone.id}`} className="text-white text-sm">Description</Label>
                        <Textarea
                          id={`edit-description-${milestone.id}`}
                          value={editMilestoneData.description}
                          onChange={(e) => setEditMilestoneData({ ...editMilestoneData, description: e.target.value })}
                          className="bg-[#232325] border-gray-700 text-white text-sm"
                          placeholder="Describe this milestone..."
                          rows={2}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveEditMilestone} disabled={loading} className="text-green-500 hover:text-green-700">
                          {loading ? "Saving..." : <Check className="w-3 h-3" />}
                        </Button>
                        <Button size="sm" onClick={cancelEditMilestone} className="text-gray-400 hover:text-gray-600">
                          <X className="w-3 h-3" />
                        </Button>
                        <Button size="sm" onClick={() => deleteItem("milestone", milestone.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="h-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-white font-medium">{milestone.title}</div>
                        <div className="text-sm text-gray-400">
                          {format(parseISO(milestone.date), "MMM d, yyyy")}
                          {milestone.description && ` • ${milestone.description}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={milestone.completed}
                          onCheckedChange={() => toggleMilestone(milestone.id, milestone.completed)}
                        />
                        <Button size="sm" variant="ghost" onClick={() => startEditMilestone(milestone)}>
                          <Edit2 className="h-3 w-3 text-blue-400" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteItem("milestone", milestone.id)}>
                          <Trash2 className="h-3 w-3 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
