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
import { X, FileText, CheckCircle2, Circle, AlertCircle, Clock, Pencil, Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RequestForm } from "@/components/requests/request-form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("notes");
  const [statusIndicator, setStatusIndicator] = useState<string>("in_progress"); // in_progress, blocked, ready

  useEffect(() => {
    loadRequest();
  }, [id]);

  async function loadRequest() {
    try {
      setLoading(true);
      const data = await requestsAPI.getById(id);
      setRequest(data);
      // Set status indicator based on request status
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
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!request) {
    return <div className="text-center py-8">Request not found</div>;
  }

  const statusStages = [
    { id: "new", label: "New Request", color: "bg-gray-400" },
    { id: "in_progress", label: "In Progress", color: "bg-green-500" },
    { id: "repaired", label: "Repaired", color: "bg-green-500" },
    { id: "scrapped", label: "Scrap", color: "bg-red-500" },
  ];

  const currentStageIndex = statusStages.findIndex((s) => s.id === request.status);

  return (
    <div className="space-y-6">
      {/* Header with breadcrumbs */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-dashed">New</Badge>
          <span className="text-muted-foreground">Maintenance Requests</span>
          <X className="h-4 w-4 text-muted-foreground cursor-pointer" />
          <span className="font-medium">{request.subject || "Test activity"}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Worksheet Button */}
      <div className="flex justify-end">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
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
              <Textarea placeholder="Add worksheet comments..." rows={10} />
              <Button>Save Comments</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Status Stages with colored indicators and status dropdown */}
      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Stages of Maintenance</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <div
                  className={`h-3 w-3 rounded-full cursor-pointer ${
                    statusIndicator === "in_progress"
                      ? "bg-gray-500"
                      : statusIndicator === "blocked"
                      ? "bg-red-500"
                      : "bg-green-500"
                  }`}
                />
                {/* {statusIndicator === "in_progress" && (
                  <Check className="h-2 w-2 text-white absolute top-0.5 left-0.5" />
                )} */}
              </div>
              {/* <Select value={statusIndicator} onValueChange={setStatusIndicator}>
                <SelectTrigger className="w-[180px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_progress">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <Check className="h-3 w-3 text-blue-500" />
                      <span>In Progress</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="blocked">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      <span>Blocked</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="ready">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span>Ready for next stage</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select> */}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {statusStages.map((stage, index) => {
              const isActive = index <= currentStageIndex;
              const isCurrent = index === currentStageIndex;
              
              return (
                <div key={stage.id} className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        isActive ? stage.color : "bg-gray-300"
                      }`}
                    />
                    <span className={`text-sm ${isActive ? "font-medium" : "text-gray-400"}`}>
                      {stage.label}
                    </span>
                  </div>
                  {index < statusStages.length - 1 && (
                    <span className="mx-2 text-gray-400">→</span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Request Details</CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">Edit</Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Request</DialogTitle>
                  <DialogDescription>Update maintenance request details</DialogDescription>
                </DialogHeader>
                <RequestForm 
                  requestId={id} 
                  onSuccess={() => { 
                    loadRequest();
                  }} 
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <Label>Subject?</Label>
                <Input value={request.subject || ""} readOnly className="mt-1" />
              </div>

              <div>
                <Label>Created By</Label>
                <Input value={request.created_by_name || "Mitchell Admin"} readOnly className="mt-1" />
              </div>

              <div>
                <Label>Maintenance For</Label>
                <Input 
                  value={request.maintenance_for === "equipment" ? "Equipment" : "Work Center"} 
                  readOnly 
                  className="mt-1" 
                />
              </div>

              {request.maintenance_for === "equipment" ? (
                <div>
                  <Label>Equipment</Label>
                  <Input 
                    value={
                      request.equipment_name 
                        ? `${request.equipment_name}${request.equipment_serial ? `/${request.equipment_serial}` : ""}`
                        : "N/A"
                    } 
                    readOnly 
                    className="mt-1" 
                  />
                </div>
              ) : (
                <div>
                  <Label>Work Center</Label>
                  <Input 
                    value={request.work_center_name || "N/A"} 
                    readOnly 
                    className="mt-1" 
                  />
                </div>
              )}

              <div>
                <Label>Category</Label>
                <Input value={request.equipment_category || "N/A"} readOnly className="mt-1" />
              </div>

              <div>
                <Label>Request Date?</Label>
                <Input 
                  value={request.created_at ? new Date(request.created_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : "12/18/2025"} 
                  readOnly 
                  className="mt-1" 
                />
              </div>

              <div>
                <Label>Maintenance Type</Label>
                <RadioGroup value={request.request_type || "corrective"} className="mt-2" disabled>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="corrective" id="corrective" />
                      <Label htmlFor="corrective">Corrective</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="preventive" id="preventive" />
                      <Label htmlFor="preventive">Preventive</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <Label>Team</Label>
                <Input value={request.team_name || "Internal Maintenance"} readOnly className="mt-1" />
              </div>

              <div>
                <Label>Technician</Label>
                <Input value={request.assigned_to_name || "Aka Foster"} readOnly className="mt-1" />
              </div>

              <div>
                <Label>Scheduled Date?</Label>
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
                  className="mt-1" 
                />
              </div>

              <div>
                <Label>Duration</Label>
                <Input 
                  value={request.duration_hours ? `${request.duration_hours} hours` : "00:00 hours"} 
                  readOnly 
                  className="mt-1" 
                />
              </div>

              <div>
                <Label>Priority</Label>
                <div className="mt-2 flex gap-2">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={`h-6 w-6 border-2 rounded-sm flex items-center justify-center rotate-45 ${
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
                <Label>Company</Label>
                <Input value={request.company_name || "My Company (San Francisco)"} readOnly className="mt-1" />
              </div>
            </div>
          </div>

          {/* Notes and Instructions Tabs */}
          <div className="mt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="instructions">Instructions</TabsTrigger>
              </TabsList>
              <TabsContent value="notes" className="mt-4">
                <Textarea
                  value={request.notes || ""}
                  readOnly
                  placeholder="No notes available"
                  rows={6}
                />
              </TabsContent>
              <TabsContent value="instructions" className="mt-4">
                <Textarea
                  value={request.instructions || ""}
                  readOnly
                  placeholder="No instructions available"
                  rows={6}
                />
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
