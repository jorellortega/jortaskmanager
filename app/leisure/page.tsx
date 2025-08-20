"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Trash2, Sun, Calendar, Edit2, Check, X, Plus } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { supabase } from "@/lib/supabaseClient"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

type LeisureActivity = {
  id: string
  user_id: string
  activity: string
  activity_date: string
  activity_time?: string | null
  completed: boolean
  created_at?: string
  parent_id?: string | null
}

export default function LeisurePage() {
  const [activities, setActivities] = useState<LeisureActivity[]>([])
  const [newActivity, setNewActivity] = useState("")
  const [newDate, setNewDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [newTime, setNewTime] = useState("");
  const [subtasks, setSubtasks] = useState<string[]>([""]);
  const [subtaskInputs, setSubtaskInputs] = useState<{ [parentId: string]: string }>({});
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editActivity, setEditActivity] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true)
      setError(null)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setError("You must be logged in to view leisure activities.")
        setLoading(false)
        return
      }
      setUserId(user.id)
      const { data, error: fetchError } = await supabase
        .from("leisure_activities")
        .select("*")
        .eq("user_id", user.id)
        .order("activity_date", { ascending: true })
      if (fetchError) {
        setError("Failed to fetch activities.")
      } else {
        setActivities(data || [])
      }
      setLoading(false)
    }
    fetchActivities()
  }, [])

  const addActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!userId) {
      setError("You must be logged in to add activities.")
      return
    }
    if (newActivity.trim()) {
      setLoading(true)
      const { data: mainData, error: insertError } = await supabase
        .from("leisure_activities")
        .insert([
          {
            user_id: userId,
            activity: newActivity.trim(),
            activity_date: newDate,
            activity_time: newTime || null,
            completed: false,
            parent_id: null,
          },
        ])
        .select()
      if (insertError) {
        setError(insertError.message || "Failed to add activity. Please try again.")
        setLoading(false)
        return
      }
      
      let newMainActivity = mainData && mainData[0];
      let newActivities = newMainActivity ? [newMainActivity] : [];
      
      // Insert subtasks if any
      if (newMainActivity && subtasks.some((s) => s.trim() !== "")) {
        const subtaskInserts = subtasks
          .filter((s) => s.trim() !== "")
          .map((s) => ({
            user_id: userId,
            activity: s.trim(),
            activity_date: newDate,
            activity_time: null,
            completed: false,
            parent_id: newMainActivity.id,
          }));
        if (subtaskInserts.length > 0) {
          const { data: subData, error: subError } = await supabase
            .from("leisure_activities")
            .insert(subtaskInserts)
            .select();
          if (subError) {
            setError(subError.message || "Failed to add subtasks. Please try again.");
          } else if (subData && subData.length > 0) {
            newActivities = [...newActivities, ...subData];
          }
        }
      }
      
      setActivities((prev) => [...prev, ...newActivities]);
      setNewActivity("")
      setNewDate(format(new Date(), "yyyy-MM-dd"))
      setNewTime("")
      setSubtasks([""])
      setLoading(false)
    }
  }

  const toggleActivity = async (id: string, completed: boolean) => {
    setError(null)
    setLoading(true)
    const { data, error: updateError } = await supabase
      .from("leisure_activities")
      .update({ completed: !completed })
      .eq("id", id)
      .select()
    if (updateError) {
      setError(updateError.message || "Failed to update activity.")
    } else if (data && data.length > 0) {
      setActivities((prev) => prev.map((a) => (a.id === id ? data[0] : a)))
    }
    setLoading(false)
  }

  const deleteActivity = async (id: string) => {
    setError(null)
    setLoading(true)
    const { error: deleteError } = await supabase
      .from("leisure_activities")
      .delete()
      .eq("id", id)
    if (deleteError) {
      setError(deleteError.message || "Failed to delete activity.")
    } else {
      setActivities((prev) => prev.filter((a) => a.id !== id))
    }
    setLoading(false)
  }

  const startEdit = (activity: LeisureActivity) => {
    setEditingId(activity.id);
    setEditActivity(activity.activity);
    setEditDate(activity.activity_date);
    setEditTime(activity.activity_time || "");
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditActivity("");
    setEditDate("");
    setEditTime("");
  };
  const saveEdit = async (id: string) => {
    setError(null);
    setLoading(true);
    const { data, error: updateError } = await supabase
      .from("leisure_activities")
      .update({ activity: editActivity, activity_date: editDate, activity_time: editTime || null })
      .eq("id", id)
      .select();
    if (updateError) {
      setError(updateError.message || "Failed to update activity.");
    } else if (data && data.length > 0) {
      setActivities((prev) => prev.map((a) => (a.id === id ? data[0] : a)));
      cancelEdit();
    }
    setLoading(false);
  };

  // Add subtask to existing activity
  const addSubtask = async (parentId: string) => {
    setError(null);
    if (!userId) {
      setError("You must be logged in to add subtasks.");
      return;
    }
    const subtaskText = subtaskInputs[parentId]?.trim();
    if (subtaskText) {
      setLoading(true);
      const { data, error: insertError } = await supabase
        .from("leisure_activities")
        .insert([
          {
            user_id: userId,
            activity: subtaskText,
            activity_date: new Date().toISOString().split("T")[0],
            activity_time: null,
            completed: false,
            parent_id: parentId,
          },
        ])
        .select();
      if (insertError) {
        setError(insertError.message || "Failed to add subtask. Please try again.");
      } else if (data && data.length > 0) {
        setActivities((prev) => [...prev, data[0]]);
        setSubtaskInputs((prev) => ({ ...prev, [parentId]: "" }));
      }
      setLoading(false);
    }
  };

  // Group activities by parent_id
  const mainActivities = activities.filter((activity) => !activity.parent_id);
  const subtasksByParent: { [parentId: string]: LeisureActivity[] } = {};
  activities.forEach((activity) => {
    if (activity.parent_id) {
      if (!subtasksByParent[activity.parent_id]) subtasksByParent[activity.parent_id] = [];
      subtasksByParent[activity.parent_id].push(activity);
    }
  });

  return (
    <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white">
      <Link href="/dashboard" className="flex items-center text-blue-500 hover:text-blue-400 mb-4">
        <ArrowLeft className="mr-2" /> Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold mb-4">Leisure Activities</h1>
      <Card className="bg-[#141415] border border-gray-700 mb-4">
        <CardHeader>
          <CardTitle className="text-white">Add New Leisure Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addActivity} className="flex flex-col space-y-2">
            <Input
              type="text"
              value={newActivity}
              onChange={(e) => setNewActivity(e.target.value)}
              placeholder="Enter a new leisure activity"
              className="bg-[#1A1A1B] border-gray-700 text-white placeholder-gray-400"
            />
            
            {/* Dynamic subtasks */}
            {newActivity.trim() && subtasks.map((sub, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  type="text"
                  value={sub}
                  onChange={e => {
                    const newSubs = [...subtasks];
                    newSubs[idx] = e.target.value;
                    // If last input and not empty, add another
                    if (idx === subtasks.length - 1 && e.target.value.trim() !== "") {
                      newSubs.push("");
                    }
                    setSubtasks(newSubs);
                  }}
                  placeholder={`Subtask ${idx + 1}`}
                  className="bg-[#1A1A1B] border-gray-700 text-white placeholder-gray-400 w-full"
                />
              </div>
            ))}
            
            <Input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="bg-[#1A1A1B] border-gray-700 text-white"
            />
            <Select
              value={newTime}
              onValueChange={setNewTime}
            >
              <SelectTrigger id="activity-time" className="bg-[#1A1A1B] border-gray-700 text-white w-full rounded px-3 py-2">
                <SelectValue placeholder="Select a time (optional)" className="!text-white !placeholder:text-gray-400" />
              </SelectTrigger>
              <SelectContent className="dark:bg-[#18181b] dark:text-white bg-[#18181b] text-white">
                {Array.from({ length: 24 * 2 }, (_, i) => {
                  const hour24 = Math.floor(i / 2);
                  const min = i % 2 === 0 ? '00' : '30';
                  const hour12 = ((hour24 + 11) % 12) + 1;
                  const ampm = hour24 < 12 ? 'AM' : 'PM';
                  const display = `${hour12.toString().padStart(2, '0')}:${min} ${ampm}`;
                  const value = `${hour24.toString().padStart(2, '0')}:${min}`;
                  return (
                    <SelectItem key={value} value={value} className="dark:bg-[#18181b] dark:text-white bg-[#18181b] text-white">
                      {display}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Button
              type="submit"
              className="text-black font-semibold bg-gradient-to-r from-yellow-400 to-yellow-200 hover:from-yellow-500 hover:to-yellow-300 transition-all duration-200"
            >
              Add Activity
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card className="bg-[#141415] border border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Your Leisure Activities</CardTitle>
        </CardHeader>
        <CardContent>
          {mainActivities.length === 0 ? (
            <p className="text-white">No leisure activities planned yet. Add some above!</p>
          ) : (
            <div className="space-y-4">
              {mainActivities.map((activity) => (
                <Card key={activity.id} className="bg-[#18181A] border border-gray-700">
                  <CardContent className="p-4">
                    {editingId === activity.id ? (
                      <>
                        <div className="flex flex-col gap-1 flex-1">
                          <Input
                            value={editActivity}
                            onChange={e => setEditActivity(e.target.value)}
                            className="mb-1 bg-[#232325] !text-white"
                          />
                          <div className="flex gap-2">
                            <Input
                              type="date"
                              value={editDate}
                              onChange={e => setEditDate(e.target.value)}
                              className="bg-[#232325] !text-white"
                            />
                            <Select
                              value={editTime}
                              onValueChange={value => setEditTime(value)}
                            >
                              <SelectTrigger id="edit-activity-time" className="bg-[#232325] border-gray-700 !text-white w-full rounded px-3 py-2">
                                <SelectValue placeholder="Select a time (optional)" className="!text-white !placeholder:text-gray-400" />
                              </SelectTrigger>
                              <SelectContent className="dark:bg-[#18181b] dark:text-white bg-[#18181b] text-white">
                                {Array.from({ length: 24 * 2 }, (_, i) => {
                                  const hour24 = Math.floor(i / 2);
                                  const min = i % 2 === 0 ? '00' : '30';
                                  const hour12 = ((hour24 + 11) % 12) + 1;
                                  const ampm = hour24 < 12 ? 'AM' : 'PM';
                                  const display = `${hour12.toString().padStart(2, '0')}:${min} ${ampm}`;
                                  const value = `${hour24.toString().padStart(2, '0')}:${min}`;
                                  return (
                                    <SelectItem key={value} value={value} className="dark:bg-[#18181b] dark:text-white bg-[#18181b] text-white">
                                      {display}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-2 mt-2">
                          <Button size="icon" variant="ghost" onClick={() => saveEdit(activity.id)} title="Save" className="text-green-500 hover:text-green-700"><Check className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={cancelEdit} title="Cancel" className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={activity.completed}
                              onCheckedChange={() => toggleActivity(activity.id, activity.completed)}
                              className="border-gray-400"
                            />
                            <span
                              className={`flex items-center ${activity.completed ? "line-through text-gray-500" : "text-white"}`}
                            >
                              <Sun className="h-4 w-4 text-yellow-400 mr-2" />
                              {activity.activity}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-400 flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {activity.activity_date}
                              {activity.activity_time && (
                                <span className="ml-2">at {activity.activity_time}</span>
                              )}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => startEdit(activity)}
                              className="text-blue-400 hover:text-blue-300"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteActivity(activity.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Subtasks */}
                        {subtasksByParent[activity.id] && subtasksByParent[activity.id].length > 0 && (
                          <div className="ml-8 mt-2 space-y-2">
                            {subtasksByParent[activity.id].map((subtask) => (
                              <div key={subtask.id} className="flex items-center gap-2 bg-[#1A1A1B] border border-gray-700 rounded px-2 py-1 text-base">
                                <Checkbox
                                  checked={subtask.completed}
                                  onCheckedChange={() => toggleActivity(subtask.id, subtask.completed)}
                                  className="border-gray-400"
                                />
                                <span className={subtask.completed ? "line-through text-gray-400" : "text-white"}>{subtask.activity}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteActivity(subtask.id)}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Add Subtask */}
                        <div className="ml-8 mt-2 flex items-center gap-2">
                          <Input
                            type="text"
                            value={subtaskInputs[activity.id] || ""}
                            onChange={(e) => setSubtaskInputs((prev) => ({ ...prev, [activity.id]: e.target.value }))}
                            placeholder="Add subtask"
                            className="w-48 bg-[#1A1A1B] border-gray-700 text-white"
                          />
                          <Button size="sm" onClick={() => addSubtask(activity.id)} disabled={loading || !(subtaskInputs[activity.id] && subtaskInputs[activity.id].trim())}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

