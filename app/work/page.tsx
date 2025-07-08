"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ArrowLeft, Briefcase, Trash2, Calendar as CalendarIcon, Edit2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export type WorkPriority = {
  id: string;
  user_id: string;
  title: string;
  due_date?: string | null;
  created_at?: string;
};

export default function WorkPage() {
  const [priorities, setPriorities] = useState<WorkPriority[]>([]);
  const [newPriority, setNewPriority] = useState("");
  const [newDueDate, setNewDueDate] = useState(""); // for date only
  const [newDueTime, setNewDueTime] = useState(""); // for time only
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
      // Combine date and time if both are present
      let dueDateValue = null;
      if (newDueDate) {
        if (newDueTime) {
          dueDateValue = `${newDueDate}T${newDueTime}`;
        } else {
          dueDateValue = newDueDate;
        }
      }
      const { data, error: insertError } = await supabase
        .from("work_priorities")
        .insert([
          {
            user_id: userId,
            title: newPriority.trim(),
            due_date: dueDateValue,
          },
        ])
        .select();
      if (insertError) {
        setError(insertError.message || "Failed to add work priority. Please try again.");
      } else if (data && data.length > 0) {
        setPriorities((prev) => [...prev, data[0]]);
        setNewPriority("");
        setNewDueDate("");
        setNewDueTime("");
      } else {
        setError("No data returned from Supabase. Check your table schema and required fields.");
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
    if (priority.due_date) {
      const dt = new Date(priority.due_date);
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
    let dueDateValue = null;
    if (editDate) {
      if (editTime) {
        dueDateValue = `${editDate}T${editTime}`;
      } else {
        dueDateValue = editDate;
      }
    }
    const { data, error: updateError } = await supabase
      .from("work_priorities")
      .update({ title: editTitle.trim(), due_date: dueDateValue })
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
            {showDateTime && (
              <div className="flex items-center gap-2 mt-2">
                <Input
                  id="due-date"
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="bg-[#1A1A1B] border-gray-700 !text-white !placeholder:text-gray-400 w-auto"
                  placeholder="Optional date"
                  style={{ minWidth: 0 }}
                />
                {newDueDate && (
                  <Input
                    id="due-time"
                    type="time"
                    value={newDueTime}
                    onChange={(e) => setNewDueTime(e.target.value)}
                    className="bg-[#1A1A1B] border-gray-700 !text-white !placeholder:text-gray-400 w-auto"
                    placeholder="Optional time"
                    style={{ minWidth: 0 }}
                  />
                )}
                <span className="text-gray-400 text-xs">(optional)</span>
              </div>
            )}
            <Button type="submit" disabled={loading}>{loading ? "Adding..." : "Add Work Priority"}</Button>
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
            <ul className="space-y-2">
              {priorities.map((priority) => (
                <li key={priority.id} className="bg-[#1A1A1B] p-2 rounded flex items-center justify-between !text-white">
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
                           <Input
                             type="time"
                             value={editTime}
                             onChange={e => setEditTime(e.target.value)}
                             className="bg-[#232325] !text-white"
                           />
                         )}
                       </div>
                     </div>
                     <div className="flex gap-2 ml-2">
                       <Button size="icon" variant="ghost" onClick={() => saveEdit(priority.id)} title="Save" className="text-green-500 hover:text-green-700"><svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg></Button>
                       <Button size="icon" variant="ghost" onClick={cancelEdit} title="Cancel" className="text-gray-400 hover:text-gray-600"><svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></Button>
                     </div>
                   </>
                 ) : (
                   <>
                     <span>
                       {priority.title}
                       {priority.due_date && (
                         <span className="ml-2 text-gray-400 text-xs flex items-center">
                           <CalendarIcon className="w-4 h-4 mr-1" />
                           {new Date(priority.due_date).toLocaleString()}
                         </span>
                       )}
                     </span>
                     <div className="flex gap-2">
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
                   </>
                 )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 