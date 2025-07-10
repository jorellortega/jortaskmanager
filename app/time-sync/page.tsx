"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, Lock, Calendar } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

function getBrowserTime() {
  const now = new Date();
  return {
    date: now,
    iso: now.toISOString(),
    locale: now.toLocaleString(),
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    offset: now.getTimezoneOffset(),
  };
}

export default function TimeSyncPage() {
  const [browserTime, setBrowserTime] = useState(getBrowserTime());
  const [lockedTime, setLockedTime] = useState<string | null>(null);
  const [serverTime, setServerTime] = useState<string | null>(null);
  const [serverDiff, setServerDiff] = useState<number | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  // Update browser time every second
  useEffect(() => {
    const interval = setInterval(() => setBrowserTime(getBrowserTime()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Load locked time from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("lockedTime");
    if (stored) setLockedTime(stored);
  }, []);

  // Fetch server time (using worldtimeapi.org as a public reference)
  const fetchServerTime = async () => {
    try {
      const res = await fetch("https://worldtimeapi.org/api/ip");
      const data = await res.json();
      setServerTime(data.datetime);
      // Compare with browser time
      const browser = new Date(browserTime.iso).getTime();
      const server = new Date(data.datetime).getTime();
      const diff = Math.abs(browser - server) / 1000; // in seconds
      setServerDiff(diff);
      if (diff > 60) {
        setWarning(
          `Warning: Your browser time is off by more than 1 minute compared to the server/reference time!`
        );
      } else {
        setWarning(null);
      }
    } catch (e) {
      setServerTime(null);
      setWarning("Could not fetch server/reference time.");
    }
  };

  useEffect(() => {
    fetchServerTime();
    // eslint-disable-next-line
  }, []);

  const handleLockIn = () => {
    localStorage.setItem("lockedTime", browserTime.iso);
    setLockedTime(browserTime.iso);
  };

  return (
    <div className="container mx-auto p-4 bg-[#0E0E0F] min-h-screen text-white">
      <Link href="/dashboard" className="flex items-center text-blue-500 hover:text-blue-400 mb-4">
        <ArrowLeft className="mr-2" /> Back to Dashboard
      </Link>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Time & Date Sync</h1>
        <p className="text-gray-400">Check and lock in your current system time and date for accurate task management.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-[#141415] border border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Your Browser Time</CardTitle>
          </CardHeader>
          <CardContent className="text-white">
            <div className="mb-2">
              <span className="font-semibold text-white">Local Time:</span> {browserTime.locale}
            </div>
            <div className="mb-2">
              <span className="font-semibold text-white">ISO:</span> {browserTime.iso}
            </div>
            <div className="mb-2">
              <span className="font-semibold text-white">Timezone:</span> {browserTime.tz} (UTC{browserTime.offset / -60})
            </div>
            <Button onClick={handleLockIn} className="mt-4 bg-green-600 hover:bg-green-700">
              <Lock className="w-4 h-4 mr-2" /> Lock In This Time
            </Button>
            {lockedTime && (
              <div className="mt-4 text-green-400">
                <Lock className="w-4 h-4 inline mr-1" /> Locked Time: {new Date(lockedTime).toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-[#141415] border border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Reference Time (Server/IP)</CardTitle>
            <Button size="icon" variant="ghost" onClick={fetchServerTime} title="Sync with Server">
              <RefreshCw className="w-5 h-5" />
            </Button>
          </CardHeader>
          <CardContent className="text-white">
            {serverTime ? (
              <>
                <div className="mb-2">
                  <span className="font-semibold text-white">Reference Time:</span> {new Date(serverTime).toLocaleString()}
                </div>
                {serverDiff !== null && (
                  <div className="mb-2">
                    <span className="font-semibold text-white">Difference:</span> {serverDiff.toFixed(1)} seconds
                  </div>
                )}
              </>
            ) : (
              <div className="text-gray-400">Loading or unavailable...</div>
            )}
            {warning && <div className="mt-4 text-yellow-400 font-semibold">{warning}</div>}
          </CardContent>
        </Card>
        <Card className="bg-[#141415] border border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Calendar Platform Time
            </CardTitle>
          </CardHeader>
          <CardContent className="text-white">
            <div className="text-2xl font-bold text-center">
              {format(browserTime.date, "MMMM d, yyyy")}
            </div>
            <div className="text-3xl font-bold text-center mt-2">
              {format(browserTime.date, "h:mm a")}
            </div>
            <div className="text-lg text-center mt-2 text-gray-300">
              {browserTime.tz}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 