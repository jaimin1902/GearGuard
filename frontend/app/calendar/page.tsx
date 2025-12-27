"use client";

import { RequestForm } from "@/components/requests/request-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { requestsAPI } from "@/lib/api";
import {
  addDays,
  addWeeks,
  endOfWeek,
  format,
  getWeek,
  isSameDay,
  parseISO,
  startOfWeek,
  subWeeks,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Plus
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

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
      const start = format(
        startOfWeek(currentWeek, { weekStartsOn: 0 }),
        "yyyy-MM-dd"
      );
      const end = format(
        endOfWeek(currentWeek, { weekStartsOn: 0 }),
        "yyyy-MM-dd"
      );
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
    <div className="space-y-4 bg-gray-50 min-h-screen p-6">
      {/* Header - Odoo Style */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#374151]">
              Maintenance Calendar
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              View and schedule preventive maintenance
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-[#714B67] hover:bg-[#714B67] hover:text-white h-9 px-4">
                <Plus className="mr-2 h-4 w-4" />
                Schedule Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
              <div className="p-6 border-b">
                <DialogTitle className="text-xl font-semibold text-[#374151]">
                  Schedule Maintenance Request
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600 mt-1">
                  Create a preventive maintenance request
                </DialogDescription>
              </div>
              <div className="p-6">
                <RequestForm
                  onSuccess={() => {
                    loadCalendarRequests();
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Calendar - Odoo Style */}
      <Card className="border border-gray-200 shadow-sm bg-white">
        <CardContent className="p-4">
          {/* Navigation Bar */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                className="h-8 w-8 border-gray-300"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                className="h-8 w-8 border-gray-300"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <select
                className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value="week"
                onChange={() => {}}
              >
                <option className="text-[#374151]" value="week">Week</option>
                <option className="text-[#374151]" value="month">Month</option>
              </select>
              <Button
                variant="outline"
                onClick={() => setCurrentWeek(new Date())}
                className="h-8 px-3 text-sm border-gray-300 text-[#374151]"
              >
                Today
              </Button>
            </div>
            <div className="text-base font-semibold text-[#374151]">
              {format(weekStart, "MMMM yyyy")} Week {getWeekNumber(currentWeek)}
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            {/* Header with days */}
            <div className="grid grid-cols-8 border-b border-gray-300 bg-gray-50">
              <div className="p-2 text-xs font-medium text-gray-600 border-r border-gray-300"></div>
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className={`p-2 text-center border-r border-gray-300 last:border-r-0 ${
                    isSameDay(day, currentDate) ? "bg-[#714B67] text-white" : ""
                  }`}
                >
                  <div className={`text-xs ${isSameDay(day, currentDate) ? "text-white" : "text-[#374151]"} uppercase mb-1`}>
                    {format(day, "EEE")}
                  </div>
                  <div
                    className={`text-base font-semibold ${
                      isSameDay(day, currentDate)
                        ? "text-white"
                        : "text-[#374151]"
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
                <div
                  key={hour}
                  className="grid grid-cols-8 border-b border-gray-200"
                >
                  {/* Time label */}
                  <div className="p-2 text-sm text-gray-600 border-r border-gray-200 bg-gray-50">
                    {String(hour).padStart(2, "0")}:00
                  </div>

                  {/* Day columns */}
                  {weekDays.map((day) => {
                    const slotRequests = getRequestsForTimeSlot(day, hour);
                    const isCurrentTime =
                      isSameDay(day, currentDate) && hour === currentHour;

                    return (
                      <div
                        key={`${day.toISOString()}-${hour}`}
                        className={`p-1 border-r border-gray-200 last:border-r-0 min-h-[60px] relative ${
                          isCurrentTime ? "bg-red-50" : "bg-white"
                        }`}
                      >
                        {isCurrentTime && (
                          <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-500 z-10" />
                        )}
                        {slotRequests.map((req) => (
                          <Link
                            key={req.id}
                            href={`/requests/${req.id}`}
                            className="block mb-1 p-1.5 rounded text-xs bg-blue-100 hover:bg-blue-200 border border-blue-300 cursor-pointer transition-colors"
                          >
                            <div className="font-medium text-gray-900 truncate">
                              {req.subject}
                            </div>
                            <div className="text-gray-600 truncate mt-0.5">
                              {req.equipment_name ||
                                req.work_center_name ||
                                "N/A"}
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

      {/* Mini Calendar - Odoo Style */}
      <Card className="w-64 border border-gray-200 shadow-sm bg-white">
        <CardHeader className="pb-3 border-b border-gray-200">
          <CardTitle className="text-sm font-semibold text-gray-900">
            {format(currentWeek, "MMMM yyyy")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
              <div key={i} className="font-semibold text-gray-500 p-1">
                {day}
              </div>
            ))}
            {Array.from({ length: 35 }, (_, i) => {
              const date = addDays(
                startOfWeek(currentWeek, { weekStartsOn: 0 }),
                i - 7
              );
              const isCurrentMonth = date.getMonth() === currentWeek.getMonth();
              const isToday = isSameDay(date, currentDate);

              return (
                <div
                  key={i}
                  className={`p-1.5 rounded ${
                    isToday
                      ? "bg-blue-600 text-white font-semibold"
                      : isCurrentMonth
                      ? "text-gray-900 hover:bg-gray-100 cursor-pointer"
                      : "text-gray-400"
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
