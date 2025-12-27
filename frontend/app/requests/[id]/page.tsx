"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requestsAPI } from "@/lib/api";
import { X, FileText, CheckCircle2, Circle, AlertCircle, Clock, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RequestForm } from "@/components/requests/request-form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("notes");
  const [statusIndicator, setStatusIndicator] = useState<string>("in_progress");

  useEffect(() => {
    loadRequest();
  }, [id]);

  async function loadRequest() {
    try {
      setLoading(true);
      const data = await requestsAPI.getById(id);
      setRequest(data);
      if (data.status === "in_progress") {
        setStatusIndicator("in_progress");
      } else if (data.status === "blocked") {
        setStatusIndicator("blocked");
      } else if (data.status === "new" && data.scheduled_date) {
        setStatusIndicator("ready");
      }
    } catch (error) {
      console.error("Failed to load request:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-gray-500">Loading request details...</div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-gray-500">Request not found</div>
          <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
        </div>
      </div>
    );
  }

  const statusStages = [
    { id: "new", label: "New Request", color: "bg-gray-400" },
    { id: "in_progress", label: "In Progress", color: "bg-blue-500" },
    { id: "repaired", label: "Repaired", color: "bg-green-500" },
    { id: "scrapped", label: "Scrap", color: "bg-red-500" },
  ];

  const currentStageIndex = statusStages.findIndex((s) => s.id === request.status);

  return (
    <div className="space-y-4 bg-gray-50 min-h-screen p-6">
      {/* Header - Odoo Style */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-dashed border-gray-300">New</Badge>
            <span className="text-sm text-gray-500">Maintenance Requests</span>
            <X className="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600" />
            <span className="font-semibold text-gray-900">{request.subject || "Test activity"}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Worksheet Button - Odoo Style */}
      <div className="flex justify-end">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2 h-9 border-gray-300 hover:bg-gray-50">
              <Pencil className="h-4 w-4" />
              Worksheet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Worksheet Comments</DialogTitle>
              <DialogDescription>Add comments and notes for this request</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea placeholder="Add worksheet comments..." rows={10} className="border-gray-300" />
              <Button className="bg-blue-600 hover:bg-blue-700">Save Comments</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Status Stages - Odoo Style */}
      <Card className="border border-gray-200 shadow-sm bg-white">
        <CardHeader className="pb-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-700">Stages of Maintenance</CardTitle>
            <div className="flex items-center gap-2">
              <div
                className={`h-3 w-3 rounded-full ${
                  statusIndicator === "in_progress"
                    ? "bg-gray-500"
                    : statusIndicator === "blocked"
                    ? "bg-red-500"
                    : "bg-green-500"
                }`}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            {statusStages.map((stage, index) => {
              const isActive = index <= currentStageIndex;
              
              return (
                <div key={stage.id} className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        isActive ? stage.color : "bg-gray-300"
                      }`}
                    />
                    <span className={`text-sm ${isActive ? "font-medium text-gray-900" : "text-gray-400"}`}>
                      {stage.label}
                    </span>
                  </div>
                  {index < statusStages.length - 1 && (
                    <span className="mx-2 text-gray-300">→</span>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Status Legend */}
          <div className="mt-4 flex items-center gap-6 text-xs text-gray-600 border-t border-gray-200 pt-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <span>Blocked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>Ready for next stage</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Form - Odoo Style */}
      <Card className="border border-gray-200 shadow-sm bg-white">
        <CardHeader className="pb-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Request Details</CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 border-gray-300 hover:bg-gray-50">
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
                <div className="p-6 border-b">
                  <DialogTitle className="text-xl font-semibold text-gray-900">Edit Request</DialogTitle>
                  <DialogDescription className="text-sm text-gray-600 mt-1">
                    Update maintenance request details
                  </DialogDescription>
                </div>
                <div className="p-6">
                  <RequestForm 
                    requestId={id} 
                    onSuccess={() => { 
                      loadRequest();
                    }} 
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-5">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Subject *</Label>
                <Input value={request.subject || ""} readOnly className="h-10 border-gray-300 bg-gray-50" />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Created By</Label>
                <Input value={request.created_by_name || "Mitchell Admin"} readOnly className="h-10 border-gray-300 bg-gray-50" />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Maintenance For</Label>
                <Input 
                  value={request.maintenance_for === "equipment" ? "Equipment" : "Work Center"} 
                  readOnly 
                  className="h-10 border-gray-300 bg-gray-50" 
                />
              </div>

              {request.maintenance_for === "equipment" ? (
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Equipment</Label>
                  <Input 
                    value={
                      request.equipment_name 
                        ? `${request.equipment_name}${request.equipment_serial ? `/${request.equipment_serial}` : ""}`
                        : "N/A"
                    } 
                    readOnly 
                    className="h-10 border-gray-300 bg-gray-50" 
                  />
                </div>
              ) : (
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Work Center</Label>
                  <Input 
                    value={request.work_center_name || "N/A"} 
                    readOnly 
                    className="h-10 border-gray-300 bg-gray-50" 
                  />
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Category</Label>
                <Input value={request.equipment_category || "N/A"} readOnly className="h-10 border-gray-300 bg-gray-50" />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Request Date</Label>
                <Input 
                  value={request.created_at ? new Date(request.created_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : "12/18/2025"} 
                  readOnly 
                  className="h-10 border-gray-300 bg-gray-50" 
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Maintenance Type</Label>
                <RadioGroup value={request.request_type || "corrective"} className="mt-2" disabled>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="corrective" id="corrective" />
                      <Label htmlFor="corrective" className="text-sm font-normal cursor-not-allowed">Corrective</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="preventive" id="preventive" />
                      <Label htmlFor="preventive" className="text-sm font-normal cursor-not-allowed">Preventive</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-5">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Team</Label>
                <Input value={request.team_name || "Internal Maintenance"} readOnly className="h-10 border-gray-300 bg-gray-50" />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Technician</Label>
                <Input value={request.assigned_to_name || "Aka Foster"} readOnly className="h-10 border-gray-300 bg-gray-50" />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Scheduled Date</Label>
                <Input 
                  value={
                    request.scheduled_datetime
                      ? new Date(request.scheduled_datetime).toLocaleString('en-US', { 
                          month: '2-digit', 
                          day: '2-digit', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false
                        }).replace(',', '')
                      : request.scheduled_date
                      ? new Date(request.scheduled_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
                      : "12/28/2025 14:30:00"
                  } 
                  readOnly 
                  className="h-10 border-gray-300 bg-gray-50" 
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Duration</Label>
                <Input 
                  value={request.duration_hours ? `${request.duration_hours} hours` : "00:00 hours"} 
                  readOnly 
                  className="h-10 border-gray-300 bg-gray-50" 
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Priority</Label>
                <div className="flex gap-2">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={`h-8 w-8 border-2 rounded-sm flex items-center justify-center rotate-45 ${
                        level <= (request.priority || 1)
                          ? "bg-gray-800 border-gray-800"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {level <= (request.priority || 1) && (
                        <div className="h-3 w-3 bg-gray-800 rounded-sm -rotate-45" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Company</Label>
                <Input value={request.company_name || "My Company (San Francisco)"} readOnly className="h-10 border-gray-300 bg-gray-50" />
              </div>
            </div>
          </div>

          {/* Notes and Instructions Tabs - Odoo Style */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-gray-100 border border-gray-200">
                <TabsTrigger value="notes" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                  Notes
                </TabsTrigger>
                <TabsTrigger value="instructions" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                  Instructions
                </TabsTrigger>
              </TabsList>
              <TabsContent value="notes" className="mt-4">
                <Textarea
                  value={request.notes || ""}
                  readOnly
                  placeholder="No notes available"
                  rows={6}
                  className="border-gray-300 bg-gray-50 resize-none"
                />
              </TabsContent>
              <TabsContent value="instructions" className="mt-4">
                <Textarea
                  value={request.instructions || ""}
                  readOnly
                  placeholder="No instructions available"
                  rows={6}
                  className="border-gray-300 bg-gray-50 resize-none"
                />
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
