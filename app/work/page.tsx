"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { ArrowLeft, Briefcase, Trash2, Calendar as CalendarIcon, Edit2, Plus } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { format, parseISO } from "date-fns"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export type WorkPriority = {
  id: string;
  user_id: string;
  title: string;
  due_date_only?: string | null;
  due_datetime?: string | null;
  created_at?: string;
  parent_id?: string | null;
};

// Helper to format due_date correctly (avoiding UTC shift for date-only strings)
function formatDueDateOnly(dateOnly: string) {
  if (!dateOnly) return null;
  return format(parseISO(dateOnly), "MMMM d, yyyy");
}
function formatDueDateTime(dateTime: string) {
  if (!dateTime) return null;
  return new Date(dateTime).toLocaleString();
}

export default function WorkPage() {
  const [priorities, setPriorities] = useState<WorkPriority[]>([]);
  const [newPriority, setNewPriority] = useState("");
  const [newDueDateOnly, setNewDueDateOnly] = useState(format(new Date(), "yyyy-MM-dd"));
  const [newDueTime, setNewDueTime] = useState("");
  const [subtasks, setSubtasks] = useState<string[]>([""]);
  const [subtaskInputs, setSubtaskInputs] = useState<{ [parentId: string]: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showDateTime, setShowDateTime] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");

  useEffect(() => {
    const getUserAndPriorities = async () => {
      setLoading(true);
      setError(null);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError("You must be logged in to view work priorities.");
        setLoading(false);
        return;
      }
      setUserId(user.id);
      const { data, error: fetchError } = await supabase
        .from("work_priorities")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (fetchError) {
        setError("Failed to fetch work priorities.");
      } else {
        setPriorities(data || []);
      }
      setLoading(false);
    };
    getUserAndPriorities();
  }, []);

  const addPriority = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!userId) {
      setError("You must be logged in to add work priorities.");
      return;
    }
    if (newPriority.trim()) {
      setLoading(true);
      let insertObj: any = {
        user_id: userId,
        title: newPriority.trim(),
        parent_id: null,
      };
      if (newDueDateOnly && !newDueTime) {
        insertObj.due_date_only = newDueDateOnly;
      } else if (newDueDateOnly && newDueTime) {
        insertObj.due_datetime = `${newDueDateOnly}T${newDueTime}`;
      }
      
      // Insert main priority
      const { data: mainData, error: insertError } = await supabase
        .from("work_priorities")
        .insert([insertObj])
        .select();
      if (insertError) {
        setError(insertError.message || "Failed to add work priority. Please try again.");
        setLoading(false);
        return;
      }
      
      let newMainPriority = mainData && mainData[0];
      let newPriorities = newMainPriority ? [newMainPriority] : [];
      
      // Insert subtasks if any
      if (newMainPriority && subtasks.some((s) => s.trim() !== "")) {
        const subtaskInserts = subtasks
          .filter((s) => s.trim() !== "")
          .map((s) => ({
            user_id: userId,
            title: s.trim(),
            due_date_only: null,
            due_datetime: null,
            parent_id: newMainPriority.id,
          }));
        if (subtaskInserts.length > 0) {
          const { data: subData, error: subError } = await supabase
            .from("work_priorities")
            .insert(subtaskInserts)
            .select();
          if (subError) {
            setError(subError.message || "Failed to add subtasks. Please try again.");
          } else if (subData && subData.length > 0) {
            newPriorities = [...newPriorities, ...subData];
          }
        }
      }
      
      setPriorities((prev) => [...prev, ...newPriorities]);
      setNewPriority("");
      setNewDueDateOnly(format(new Date(), "yyyy-MM-dd"));
      setNewDueTime("");
      setSubtasks([""]);
      setLoading(false);
    }
  };

  // Add subtask to existing priority
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
        .from("work_priorities")
        .insert([
          {
            user_id: userId,
            title: subtaskText,
            due_date_only: null,
            due_datetime: null,
            parent_id: parentId,
          },
        ])
        .select();
      if (insertError) {
        setError(insertError.message || "Failed to add subtask. Please try again.");
      } else if (data && data.length > 0) {
        setPriorities((prev) => [...prev, data[0]]);
        setSubtaskInputs((prev) => ({ ...prev, [parentId]: "" }));
      }
      setLoading(false);
    }
  };

  const deletePriority = async (id: string) => {
    setError(null);
    setLoading(true);
    const { error: deleteError } = await supabase
      .from("work_priorities")
      .delete()
      .eq("id", id);
    if (deleteError) {
      setError(deleteError.message || "Failed to delete work priority.");
    } else {
      setPriorities((prev) => prev.filter((priority) => priority.id !== id));
    }
    setLoading(false);
  };

  const startEdit = (priority: WorkPriority) => {
    setEditingId(priority.id);
    setEditTitle(priority.title);
    if (priority.due_date_only) {
      setEditDate(priority.due_date_only);
      setEditTime("");
    } else if (priority.due_datetime) {
      const dt = new Date(priority.due_datetime);
      setEditDate(dt.toISOString().slice(0, 10));
      setEditTime(dt.toISOString().slice(11, 16));
    } else {
      setEditDate("");
      setEditTime("");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDate("");
    setEditTime("");
  };

  const saveEdit = async (id: string) => {
    setError(null);
    setLoading(true);
    let updateObj: any = { title: editTitle.trim(), due_date_only: null, due_datetime: null };
    if (editDate && !editTime) {
      updateObj.due_date_only = editDate;
    } else if (editDate && editTime) {
      updateObj.due_datetime = `${editDate}T${editTime}`;
    }
    const { data, error: updateError } = await supabase
      .from("work_priorities")
      .update(updateObj)
      .eq("id", id)
      .select();
    if (updateError) {
      setError(updateError.message || "Failed to update work priority.");
    } else if (data && data.length > 0) {
      setPriorities((prev) => prev.map((p) => (p.id === id ? data[0] : p)));
      cancelEdit();
    }
    setLoading(false);
  };

  // Group priorities by parent_id
  const mainPriorities = priorities.filter((priority) => !priority.parent_id);
  const subtasksByParent: { [parentId: string]: WorkPriority[] } = useMemo(() => {
    const map: { [parentId: string]: WorkPriority[] } = {};
    priorities.forEach((priority) => {
      if (priority.parent_id) {
        if (!map[priority.parent_id]) map[priority.parent_id] = [];
        map[priority.parent_id].push(priority);
      }
    });
    return map;
  }, [priorities]);

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }
  if (loading && priorities.length === 0) {
    return <div className="text-white p-4">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white">
      <Link href="/dashboard" className="flex items-center text-blue-500 hover:text-blue-400 mb-4">
        <ArrowLeft className="mr-2" /> Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold mb-4 flex items-center">
        <Briefcase className="mr-2" /> Work Priorities
      </h1>
      <Card className="bg-[#141415] border border-gray-700 mb-4 p-4">
        <CardHeader>
          <CardTitle className="!text-white">Add New Work Priority</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addPriority} className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                id="priority-title"
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="bg-[#1A1A1B] border-gray-700 !text-white !placeholder:text-gray-400"
                placeholder="Enter work priority title"
              />
              <button
                type="button"
                className="ml-1 p-2 rounded hover:bg-[#232325]"
                onClick={() => setShowDateTime((v) => !v)}
                aria-label="Add date/time"
              >
                <CalendarIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            {/* Dynamic subtasks */}
            {newPriority.trim() && subtasks.map((sub, idx) => (
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
            
            {showDateTime && (
              <div className="flex items-center gap-2 mt-2">
                <Input
                  id="due-date"
                  type="date"
                  value={newDueDateOnly}
                  onChange={(e) => setNewDueDateOnly(e.target.value)}
                  className="bg-[#1A1A1B] border-gray-700 !text-white !placeholder:text-gray-400 w-auto"
                  placeholder="Optional date"
                  style={{ minWidth: 0 }}
                />
                {newDueDateOnly && (
                  <Select
                    value={newDueTime}
                    onValueChange={(value) => setNewDueTime(value)}
                  >
                    <SelectTrigger id="due-time" className="bg-[#1A1A1B] border-gray-700 !text-white w-full rounded px-3 py-2">
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
                )}
                <span className="text-gray-400 text-xs">(optional)</span>
              </div>
            )}
            <Button type="submit" disabled={loading} className="bg-gradient-to-r from-green-500 to-white hover:from-green-600 hover:to-gray-100 text-gray-800 font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105">
              {loading ? "Adding..." : "Add Work Priority"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card className="bg-[#141415] border border-gray-700">
        <CardHeader>
          <CardTitle className="!text-white">Your Work Priorities</CardTitle>
        </CardHeader>
        <CardContent>
          {priorities.length === 0 ? (
            <p>No work priorities added yet.</p>
          ) : (
            <div className="space-y-4">
              {mainPriorities.map((priority) => (
                <Card key={priority.id} className="bg-[#18181A] border border-gray-700">
                  <CardContent className="p-4">
                    {editingId === priority.id ? (
                      <>
                        <div className="flex flex-col gap-1 flex-1">
                          <Input
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            className="mb-1 bg-[#232325] !text-white"
                          />
                          <div className="flex gap-2">
                            <Input
                              type="date"
                              value={editDate}
                              onChange={e => setEditDate(e.target.value)}
                              className="bg-[#232325] !text-white"
                            />
                            {editDate && (
                              <Select
                                value={editTime}
                                onValueChange={value => setEditTime(value)}
                              >
                                <SelectTrigger id="edit-due-time" className="bg-[#232325] border-gray-700 !text-white w-full rounded px-3 py-2">
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
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-2 mt-2">
                          <Button size="icon" variant="ghost" onClick={() => saveEdit(priority.id)} title="Save" className="text-green-500 hover:text-green-700"><svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg></Button>
                          <Button size="icon" variant="ghost" onClick={cancelEdit} title="Cancel" className="text-gray-400 hover:text-gray-600"><svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-white">
                              {priority.title}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {priority.due_date_only && (
                              <span className="text-sm text-gray-400 flex items-center">
                                <CalendarIcon className="h-4 w-4 inline mr-1" />
                                {formatDueDateOnly(priority.due_date_only)}
                              </span>
                            )}
                            {priority.due_datetime && (
                              <span className="text-sm text-gray-400 flex items-center">
                                <CalendarIcon className="h-4 w-4 inline mr-1" />
                                {formatDueDateTime(priority.due_datetime)}
                              </span>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => startEdit(priority)}
                              className="text-blue-400 hover:text-blue-600"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deletePriority(priority.id)}
                              className="text-red-500 hover:text-red-700"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Subtasks */}
                        {subtasksByParent[priority.id] && subtasksByParent[priority.id].length > 0 && (
                          <div className="ml-8 mt-2 space-y-2">
                            {subtasksByParent[priority.id].map((subtask) => (
                              <div key={subtask.id} className="flex items-center gap-2 bg-[#1A1A1B] border border-gray-700 rounded px-2 py-1 text-base">
                                <span className="text-white">{subtask.title}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deletePriority(subtask.id)}
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
                            value={subtaskInputs[priority.id] || ""}
                            onChange={(e) => setSubtaskInputs((prev) => ({ ...prev, [priority.id]: e.target.value }))}
                            placeholder="Add subtask"
                            className="w-48 bg-[#1A1A1B] border-gray-700 text-white"
                          />
                          <Button size="sm" onClick={() => addSubtask(priority.id)} disabled={loading || !(subtaskInputs[priority.id] && subtaskInputs[priority.id].trim())}>
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
  );
} 