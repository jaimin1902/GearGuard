"use client";

import { useEffect, useState } from "react";
import { requestsAPI } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RequestForm } from "@/components/requests/request-form";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, getWeek, parseISO, isSameDay, addDays } from "date-fns";
import Link from "next/link";

export default function CalendarPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCalendarRequests();
  }, [currentWeek]);

  async function loadCalendarRequests() {
    try {
      setLoading(true);
      const start = format(startOfWeek(currentWeek), "yyyy-MM-dd");
      const end = format(endOfWeek(currentWeek), "yyyy-MM-dd");
      const data = await requestsAPI.getCalendar(start, end);
      setRequests(data);
    } catch (error) {
      console.error("Failed to load calendar requests:", error);
    } finally {
      setLoading(false);
    }
  }

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 }); // Sunday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 18 }, (_, i) => i + 6); // 6:00 to 23:00

  function getRequestsForTimeSlot(date: Date, hour: number) {
    return requests.filter((req) => {
      if (!req.scheduled_datetime && !req.scheduled_date) return false;
      
      try {
        const scheduledDate = req.scheduled_datetime 
          ? parseISO(req.scheduled_datetime)
          : parseISO(req.scheduled_date);
        
        const isSameDate = isSameDay(scheduledDate, date);
        const scheduledHour = scheduledDate.getHours();
        
        return isSameDate && scheduledHour === hour;
      } catch {
        return false;
      }
    });
  }

  const currentHour = new Date().getHours();
  const currentDate = new Date();

  function getWeekNumber(date: Date) {
    return getWeek(date, { weekStartsOn: 0, firstWeekContainsDate: 4 });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Maintenance Calendar</h1>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Schedule Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Schedule Maintenance Request</DialogTitle>
              <DialogDescription>Create a preventive maintenance request</DialogDescription>
            </DialogHeader>
            <RequestForm onSuccess={() => { loadCalendarRequests(); }} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Navigation Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <select
                className="px-3 py-2 border rounded-md"
                value="week"
                onChange={() => {}}
              >
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
              <Button
                variant="outline"
                onClick={() => setCurrentWeek(new Date())}
              >
                Today
              </Button>
            </div>
            <div className="text-lg font-medium">
              {format(weekStart, "MMMM yyyy")} Week {getWeekNumber(currentWeek)}
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="border rounded-lg overflow-hidden">
            {/* Header with days */}
            <div className="grid grid-cols-8 border-b bg-muted/50">
              <div className="p-2 text-sm font-medium border-r"></div>
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className={`p-2 text-center border-r last:border-r-0 ${
                    isSameDay(day, currentDate) ? "bg-red-50" : ""
                  }`}
                >
                  <div className="text-xs text-muted-foreground">
                    {format(day, "EEE").toUpperCase()}
                  </div>
                  <div
                    className={`text-lg font-semibold ${
                      isSameDay(day, currentDate) ? "text-red-600" : ""
                    }`}
                  >
                    {format(day, "d")}
                  </div>
                </div>
              ))}
            </div>

            {/* Time slots and grid */}
            <div className="overflow-y-auto" style={{ maxHeight: "600px" }}>
              {hours.map((hour) => (
                <div key={hour} className="grid grid-cols-8 border-b">
                  {/* Time label */}
                  <div className="p-2 text-sm text-muted-foreground border-r bg-muted/30">
                    {String(hour).padStart(2, "0")}:00
                  </div>
                  
                  {/* Day columns */}
                  {weekDays.map((day) => {
                    const slotRequests = getRequestsForTimeSlot(day, hour);
                    const isCurrentTime = isSameDay(day, currentDate) && hour === currentHour;
                    
                    return (
                      <div
                        key={`${day.toISOString()}-${hour}`}
                        className={`p-1 border-r last:border-r-0 min-h-[60px] relative ${
                          isCurrentTime ? "bg-red-50" : ""
                        }`}
                      >
                        {isCurrentTime && (
                          <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-500 z-10" />
                        )}
                        {slotRequests.map((req) => (
                          <Link
                            key={req.id}
                            href={`/requests/${req.id}`}
                            className="block mb-1 p-1 rounded text-xs bg-blue-100 hover:bg-blue-200 border border-blue-300 cursor-pointer"
                          >
                            <div className="font-medium truncate">{req.subject}</div>
                            <div className="text-muted-foreground truncate">
                              {req.equipment_name || req.work_center_name || "N/A"}
                            </div>
                          </Link>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mini Calendar */}
      <Card className="w-64">
        <CardHeader>
          <CardTitle className="text-sm">{format(currentWeek, "MMMM yyyy")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
              <div key={i} className="font-medium text-muted-foreground p-1">
                {day}
              </div>
            ))}
            {Array.from({ length: 35 }, (_, i) => {
              const date = addDays(startOfWeek(currentWeek, { weekStartsOn: 0 }), i - 7);
              const isCurrentMonth = date.getMonth() === currentWeek.getMonth();
              const isToday = isSameDay(date, currentDate);
              
              return (
                <div
                  key={i}
                  className={`p-1 ${
                    isToday
                      ? "bg-blue-500 text-white rounded-full"
                      : isCurrentMonth
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {format(date, "d")}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
