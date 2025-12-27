"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { requestsAPI, equipmentAPI, workCentersAPI, usersAPI, teamsAPI } from "@/lib/api";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const requestSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  description: z.string().optional(),
  request_type: z.enum(["corrective", "preventive"]),
  maintenance_for: z.enum(["equipment", "work_center"]),
  equipment_id: z.string().optional(),
  work_center_id: z.string().optional(),
  scheduled_date: z.string().optional(),
  scheduled_datetime: z.string().optional(),
  assigned_to_user_id: z.string().optional(),
  duration_hours: z.string().optional(),
  priority: z.number().min(1).max(3).optional(),
  notes: z.string().optional(),
  instructions: z.string().optional(),
  status: z.enum(["new", "in_progress", "repaired", "scrapped"]).optional(),
}).refine((data) => {
  if (data.maintenance_for === "equipment") {
    return !!data.equipment_id;
  } else {
    return !!data.work_center_id;
  }
}, {
  message: "Equipment or Work Center is required",
  path: ["equipment_id"],
});

type RequestFormValues = z.infer<typeof requestSchema>;

interface RequestFormProps {
  requestId?: number;
  onSuccess: () => void;
}

export function RequestForm({ requestId, onSuccess }: RequestFormProps) {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [workCenters, setWorkCenters] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [selectedWorkCenter, setSelectedWorkCenter] = useState<any>(null);

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      subject: "",
      description: "",
      request_type: "corrective",
      maintenance_for: "equipment",
      equipment_id: "",
      work_center_id: "",
      scheduled_date: "",
      scheduled_datetime: "",
      assigned_to_user_id: "",
      duration_hours: "",
      priority: 1,
      notes: "",
      instructions: "",
      status: "new",
    },
  });

  const maintenanceFor = form.watch("maintenance_for");

  useEffect(() => {
    loadOptions();
    if (requestId) {
      loadRequest();
    }
  }, [requestId]);

  async function loadOptions() {
    try {
      const [equipData, workCenterData, usersData, teamsData] = await Promise.all([
        equipmentAPI.getAll(),
        workCentersAPI.getAll(),
        usersAPI.getTechnicians(),
        teamsAPI.getAll(),
      ]);
      setEquipment(equipData);
      setWorkCenters(workCenterData);
      setUsers(usersData);
      setTeams(teamsData);
    } catch (error) {
      console.error("Failed to load options:", error);
    }
  }

  async function loadRequest() {
    try {
      const data = await requestsAPI.getById(requestId!);
      const maintenanceFor = data.maintenance_for || "equipment";
      
      form.reset({
        subject: data.subject || "",
        description: data.description || "",
        request_type: data.request_type || "corrective",
        maintenance_for: maintenanceFor,
        equipment_id: maintenanceFor === "equipment" && data.equipment_id ? data.equipment_id.toString() : "",
        work_center_id: maintenanceFor === "work_center" && data.work_center_id ? data.work_center_id.toString() : "",
        scheduled_date: data.scheduled_date || "",
        scheduled_datetime: data.scheduled_datetime ? new Date(data.scheduled_datetime).toISOString().slice(0, 16) : "",
        assigned_to_user_id: data.assigned_to_user_id ? data.assigned_to_user_id.toString() : "",
        duration_hours: data.duration_hours?.toString() || "",
        priority: data.priority || 1,
        notes: data.notes || "",
        instructions: data.instructions || "",
        status: data.status || "new",
      });
      
      // Load selected equipment or work center details for display
      if (maintenanceFor === "equipment" && data.equipment_id) {
        await handleEquipmentChange(data.equipment_id.toString());
      } else if (maintenanceFor === "work_center" && data.work_center_id) {
        await handleWorkCenterChange(data.work_center_id.toString());
      }
    } catch (error) {
      console.error("Failed to load request:", error);
    }
  }

  async function handleEquipmentChange(equipmentId: string) {
    if (equipmentId) {
      try {
        const equip = await equipmentAPI.getById(parseInt(equipmentId));
        setSelectedEquipment(equip);
        
        // Auto-fill default technician (team is auto-filled by backend)
        if (equip.default_technician_id) {
          form.setValue("assigned_to_user_id", equip.default_technician_id.toString());
        }
      } catch (error) {
        console.error("Failed to load equipment:", error);
      }
    }
  }

  async function handleWorkCenterChange(workCenterId: string) {
    if (workCenterId) {
      try {
        const wc = await workCentersAPI.getById(parseInt(workCenterId));
        setSelectedWorkCenter(wc);
      } catch (error) {
        console.error("Failed to load work center:", error);
      }
    }
  }

  async function onSubmit(values: RequestFormValues) {
    try {
      const payload: any = {
        ...values,
        equipment_id: values.maintenance_for === "equipment" && values.equipment_id ? parseInt(values.equipment_id) : null,
        work_center_id: values.maintenance_for === "work_center" && values.work_center_id ? parseInt(values.work_center_id) : null,
        assigned_to_user_id: values.assigned_to_user_id ? parseInt(values.assigned_to_user_id) : null,
        scheduled_date: values.scheduled_date || null,
        scheduled_datetime: values.scheduled_datetime || null,
        duration_hours: values.duration_hours ? parseFloat(values.duration_hours) : null,
        priority: values.priority || 1,
        created_by_user_id: 1, // TODO: Get from auth context
      };

      if (requestId) {
        await requestsAPI.update(requestId, payload);
      } else {
        await requestsAPI.create(payload);
      }
      onSuccess();
      if (!requestId) {
        form.reset();
      }
    } catch (error) {
      console.error("Failed to save request:", error);
      alert("Failed to save request. Please try again.");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subject? *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="What is wrong?" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maintenance_for"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maintenance For *</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Clear the other field when switching
                    if (value === "equipment") {
                      form.setValue("work_center_id", "");
                      form.setValue("equipment_id", "");
                      setSelectedWorkCenter(null);
                    } else {
                      form.setValue("equipment_id", "");
                      form.setValue("work_center_id", "");
                      setSelectedEquipment(null);
                    }
                  }} 
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="work_center">Work Center</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {maintenanceFor === "equipment" ? (
          <FormField
            control={form.control}
            name="equipment_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Equipment *</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleEquipmentChange(value);
                  }}
                  value={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select equipment" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {equipment.length > 0 ? (
                      equipment.map((eq) => (
                        <SelectItem key={eq.id} value={eq.id.toString()}>
                          {eq.name} {eq.serial_number ? `(${eq.serial_number})` : ""}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-equipment" disabled>No equipment available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {selectedEquipment && (
                  <p className="text-xs text-muted-foreground">
                    Category: {selectedEquipment.equipment_category_name || selectedEquipment.category || "N/A"} | Team: {selectedEquipment.maintenance_team_name || "N/A"}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <FormField
            control={form.control}
            name="work_center_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work Center *</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleWorkCenterChange(value);
                  }}
                  value={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select work center" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {workCenters.length > 0 ? (
                      workCenters.map((wc) => (
                        <SelectItem key={wc.id} value={wc.id.toString()}>
                          {wc.name} {wc.code ? `(${wc.code})` : ""}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-workcenters" disabled>No work centers available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {selectedWorkCenter && (
                  <p className="text-xs text-muted-foreground">
                    Team: {selectedWorkCenter.maintenance_team_name}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="request_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maintenance Type *</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="corrective" id="corrective" />
                      <Label htmlFor="corrective">Corrective</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="preventive" id="preventive" />
                      <Label htmlFor="preventive">Preventive</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => field.onChange(level)}
                        className={`h-8 w-8 border-2 rounded-sm flex items-center justify-center ${
                          level <= (field.value || 1)
                            ? "bg-primary border-primary text-white"
                            : "border-gray-300"
                        }`}
                      >
                        {level <= (field.value || 1) && "✓"}
                      </button>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="scheduled_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Scheduled Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="scheduled_datetime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Scheduled Date & Time</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="assigned_to_user_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Technician</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select technician (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {users.length > 0 ? (
                      users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-users" disabled>No technicians available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration_hours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (Hours)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Additional details" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Tabs defaultValue="notes" className="w-full">
          <TabsList>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
          </TabsList>
          <TabsContent value="notes" className="mt-4">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea {...field} placeholder="Add notes..." rows={6} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
          <TabsContent value="instructions" className="mt-4">
            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea {...field} placeholder="Add instructions..." rows={6} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

        {requestId && (
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="repaired">Repaired</SelectItem>
                    <SelectItem value="scrapped">Scrapped</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" className="w-full">
          {requestId ? "Update Request" : "Create Request"}
        </Button>
      </form>
    </Form>
  );
}
