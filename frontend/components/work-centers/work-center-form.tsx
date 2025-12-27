"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { workCentersAPI, departmentsAPI, teamsAPI } from "@/lib/api";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const workCenterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().optional(),
  tag: z.string().optional(),
  location: z.string().optional(),
  department_id: z.string().optional(),
  maintenance_team_id: z.string().min(1, "Maintenance team is required"),
  description: z.string().optional(),
  alternative_workcenters: z.string().optional(),
  cost_per_hour: z.string().optional(),
  capacity_time_efficiency: z.string().optional(),
  oee_target: z.string().optional(),
});

type WorkCenterFormValues = z.infer<typeof workCenterSchema>;

interface WorkCenterFormProps {
  workCenterId?: number;
  onSuccess: () => void;
}

export function WorkCenterForm({ workCenterId, onSuccess }: WorkCenterFormProps) {
  const [departments, setDepartments] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [allWorkCenters, setAllWorkCenters] = useState<any[]>([]);
  const [selectedAlternatives, setSelectedAlternatives] = useState<string[]>([]);

  const form = useForm<WorkCenterFormValues>({
    resolver: zodResolver(workCenterSchema),
    defaultValues: {
      name: "",
      code: "",
      tag: "",
      location: "",
      department_id: "",
      maintenance_team_id: "",
      description: "",
      alternative_workcenters: "",
      cost_per_hour: "0.00",
      capacity_time_efficiency: "100.00",
      oee_target: "0.00",
    },
  });

  useEffect(() => {
    loadOptions();
    if (workCenterId) {
      loadWorkCenter();
    }
  }, [workCenterId]);

  async function loadOptions() {
    try {
      const [deptData, teamsData, workCentersData] = await Promise.all([
        departmentsAPI.getAll(),
        teamsAPI.getAll(),
        workCentersAPI.getAll(),
      ]);
      setDepartments(deptData);
      setTeams(teamsData);
      setAllWorkCenters(workCentersData);
    } catch (error) {
      console.error("Failed to load options:", error);
    }
  }

  async function loadWorkCenter() {
    try {
      const data = await workCentersAPI.getById(workCenterId!);
      const alternatives = data.alternative_workcenters 
        ? (typeof data.alternative_workcenters === 'string' 
            ? data.alternative_workcenters.split(',').filter(Boolean)
            : [])
        : [];
      
      setSelectedAlternatives(alternatives);
      
      form.reset({
        name: data.name || "",
        code: data.code || "",
        tag: data.tag || "",
        location: data.location || "",
        department_id: data.department_id?.toString() || "",
        maintenance_team_id: data.maintenance_team_id?.toString() || "",
        description: data.description || "",
        alternative_workcenters: data.alternative_workcenters || "",
        cost_per_hour: data.cost_per_hour?.toString() || "0.00",
        capacity_time_efficiency: data.capacity_time_efficiency?.toString() || "100.00",
        oee_target: data.oee_target?.toString() || "0.00",
      });
    } catch (error) {
      console.error("Failed to load work center:", error);
    }
  }

  async function onSubmit(values: WorkCenterFormValues) {
    try {
      // Helper function to safely parse integer
      const parseId = (value: string | undefined): number | null => {
        if (!value || value === "" || value === "undefined") return null;
        const parsed = parseInt(value);
        return isNaN(parsed) ? null : parsed;
      };
      
      // Helper function to safely parse float
      const parseFloatValue = (value: string | undefined, defaultValue: number): number => {
        if (!value || value === "" || value === "undefined") return defaultValue;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? defaultValue : parsed;
      };
      
      // Validate required fields
      if (!values.maintenance_team_id || values.maintenance_team_id === "" || values.maintenance_team_id === "undefined") {
        alert("Maintenance Team is required");
        return;
      }
      
      const teamId = parseId(values.maintenance_team_id);
      if (!teamId) {
        alert("Please select a valid Maintenance Team");
        return;
      }
      
      const payload: any = {
        name: values.name,
        code: values.code && values.code.trim() !== "" ? values.code : null,
        tag: values.tag && values.tag.trim() !== "" ? values.tag : null,
        location: values.location && values.location.trim() !== "" ? values.location : null,
        department_id: parseId(values.department_id),
        maintenance_team_id: teamId,
        description: values.description && values.description.trim() !== "" ? values.description : null,
        alternative_workcenters: selectedAlternatives.length > 0 ? selectedAlternatives.join(",") : null,
        cost_per_hour: parseFloatValue(values.cost_per_hour, 0.00),
        capacity_time_efficiency: parseFloatValue(values.capacity_time_efficiency, 100.00),
        oee_target: parseFloatValue(values.oee_target, 0.00),
      };

      if (workCenterId) {
        await workCentersAPI.update(workCenterId, payload);
      } else {
        await workCentersAPI.create(payload);
      }
      onSuccess();
      if (!workCenterId) {
        form.reset();
        setSelectedAlternatives([]);
      }
    } catch (error: any) {
      console.error("Failed to save work center:", error);
      const errorMessage = error?.message || "Failed to save work center. Please try again.";
      alert(errorMessage);
    }
  }

  const availableWorkCenters = allWorkCenters.filter(
    (wc) => !workCenterId || wc.id !== workCenterId
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work Center Name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., Assembly 1, Drill 1" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Work center code" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="tag"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tag</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Tag identifier" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Physical location" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="department_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <Select onValueChange={(value) => field.onChange(value === "" ? undefined : value)} value={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maintenance_team_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maintenance Team *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="cost_per_hour"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost per hour</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} placeholder="0.00" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="capacity_time_efficiency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacity Time Efficiency (%)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} placeholder="100.00" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="oee_target"
            render={({ field }) => (
              <FormItem>
                <FormLabel>OEE Target (%)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} placeholder="0.00" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="alternative_workcenters"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alternative Workcenters</FormLabel>
              <FormControl>
                <Select
                  onValueChange={(value) => {
                    if (value && !selectedAlternatives.includes(value)) {
                      const updated = [...selectedAlternatives, value];
                      setSelectedAlternatives(updated);
                      field.onChange(updated.join(","));
                    }
                  }}
                  value=""
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select alternative work center" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableWorkCenters.map((wc) => (
                      <SelectItem key={wc.id} value={wc.id.toString()}>
                        {wc.name} {wc.code ? `(${wc.code})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              {selectedAlternatives.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedAlternatives.map((altId) => {
                    const wc = allWorkCenters.find((w) => w.id.toString() === altId);
                    return wc ? (
                      <span
                        key={altId}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                      >
                        {wc.name}
                        <button
                          type="button"
                          onClick={() => {
                            const updated = selectedAlternatives.filter((id) => id !== altId);
                            setSelectedAlternatives(updated);
                            field.onChange(updated.join(","));
                          }}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Work center description" rows={4} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          {workCenterId ? "Update Work Center" : "Create Work Center"}
        </Button>
      </form>
    </Form>
  );
}

