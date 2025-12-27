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
import { equipmentAPI, departmentsAPI, teamsAPI, usersAPI, equipmentCategoriesAPI, workCentersAPI } from "@/lib/api";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Wrench } from "lucide-react";
import Link from "next/link";

const equipmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  equipment_category_id: z.string().min(1, "Equipment Category is required"),
  company: z.string().optional(),
  used_by: z.enum(["employee", "department"]).default("employee"),
  maintenance_team_id: z.string().min(1, "Maintenance team is required"),
  department_id: z.string().optional(),
  assigned_date: z.string().optional(),
  description: z.string().optional(),
  default_technician_id: z.string().optional(),
  assigned_to_user_id: z.string().optional(),
  scrap_date: z.string().optional(),
  used_in_location: z.string().optional(),
  work_center_id: z.string().optional(),
});

type EquipmentFormValues = z.infer<typeof equipmentSchema>;

interface EquipmentFormProps {
  equipmentId?: number;
  onSuccess: () => void;
  openRequestsCount?: number;
}

export function EquipmentForm({ equipmentId, onSuccess, openRequestsCount = 0 }: EquipmentFormProps) {
  const [departments, setDepartments] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [workCenters, setWorkCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);

  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      name: "",
      equipment_category_id: "",
      company: "",
      used_by: "employee",
      maintenance_team_id: "",
      department_id: "",
      assigned_date: "",
      description: "",
      default_technician_id: "",
      assigned_to_user_id: "",
      scrap_date: "",
      used_in_location: "",
      work_center_id: "",
    },
  });

  useEffect(() => {
    loadOptions();
    if (equipmentId) {
      loadEquipment();
      loadRequests();
    }
  }, [equipmentId]);

  async function loadOptions() {
    try {
      const [deptData, teamsData, usersData, categoriesData, workCentersData] = await Promise.all([
        departmentsAPI.getAll(),
        teamsAPI.getAll(),
        usersAPI.getAll(),
        equipmentCategoriesAPI.getAll(),
        workCentersAPI.getAll(),
      ]);
      setDepartments(deptData);
      setTeams(teamsData);
      setUsers(usersData);
      setCategories(categoriesData);
      setWorkCenters(workCentersData);
    } catch (error) {
      console.error("Failed to load options:", error);
    }
  }

  async function loadEquipment() {
    try {
      const data = await equipmentAPI.getById(equipmentId!);
      form.reset({
        name: data.name || "",
        equipment_category_id: data.equipment_category_id?.toString() || "",
        company: data.company || "",
        used_by: data.used_by || "employee",
        maintenance_team_id: data.maintenance_team_id?.toString() || "",
        department_id: data.department_id?.toString() || "",
        assigned_date: data.assigned_date ? data.assigned_date.split('T')[0] : "",
        description: data.description || "",
        default_technician_id: data.default_technician_id?.toString() || "",
        assigned_to_user_id: data.assigned_to_user_id?.toString() || "",
        scrap_date: data.scrap_date ? data.scrap_date.split('T')[0] : "",
        used_in_location: data.used_in_location || "",
        work_center_id: data.work_center_id?.toString() || "",
      });
    } catch (error) {
      console.error("Failed to load equipment:", error);
    }
  }

  async function loadRequests() {
    try {
      if (equipmentId) {
        const data = await equipmentAPI.getRequests(equipmentId);
        setRequests(data);
      }
    } catch (error) {
      console.error("Failed to load requests:", error);
    }
  }

  async function onSubmit(values: EquipmentFormValues) {
    try {
      setLoading(true);
      
      // Helper function to safely parse integer
      const parseId = (value: string | undefined): number | null => {
        if (!value || value === "" || value === "undefined") return null;
        const parsed = parseInt(value);
        return isNaN(parsed) ? null : parsed;
      };
      
      // Validate required fields
      if (!values.equipment_category_id || values.equipment_category_id === "" || values.equipment_category_id === "undefined") {
        alert("Equipment Category is required");
        setLoading(false);
        return;
      }
      
      if (!values.maintenance_team_id || values.maintenance_team_id === "" || values.maintenance_team_id === "undefined") {
        alert("Maintenance Team is required");
        setLoading(false);
        return;
      }
      
      const categoryId = parseId(values.equipment_category_id);
      const teamId = parseId(values.maintenance_team_id);
      
      if (!categoryId || !teamId) {
        alert("Please select valid Equipment Category and Maintenance Team");
        setLoading(false);
        return;
      }
      
      const payload: any = {
        name: values.name,
        equipment_category_id: categoryId,
        company: values.company && values.company.trim() !== "" ? values.company : null,
        used_by: values.used_by || "employee",
        maintenance_team_id: teamId,
        department_id: parseId(values.department_id),
        assigned_date: values.assigned_date && values.assigned_date !== "" ? values.assigned_date : null,
        description: values.description && values.description.trim() !== "" ? values.description : null,
        default_technician_id: parseId(values.default_technician_id),
        assigned_to_user_id: parseId(values.assigned_to_user_id),
        scrap_date: values.scrap_date && values.scrap_date !== "" ? values.scrap_date : null,
        used_in_location: values.used_in_location && values.used_in_location.trim() !== "" ? values.used_in_location : null,
        work_center_id: parseId(values.work_center_id),
      };

      if (equipmentId) {
        await equipmentAPI.update(equipmentId, payload);
      } else {
        await equipmentAPI.create(payload);
      }
      onSuccess();
    } catch (error: any) {
      console.error("Failed to save equipment:", error);
      const errorMessage = error?.message || "Failed to save equipment. Please try again.";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  const openRequests = requests.filter((r) => r.status === "new" || r.status === "in_progress");
  const displayCount = openRequests.length;

  return (
    <div className="space-y-4">
      {equipmentId && (
        <div className="flex justify-end">
          <Button asChild variant="outline" className="gap-2">
            <Link href={`/requests?equipment_id=${equipmentId}`}>
              <Wrench className="h-4 w-4" />
              Maintenance
              {displayCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {displayCount}
                </Badge>
              )}
            </Link>
          </Button>
        </div>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name? *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="equipment_category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipment Category? *</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                      }} 
                      value={field.value && field.value !== "" ? field.value : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">No categories available</div>
                        ) : (
                          categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company?</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., My Company (San Francisco)" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="used_by"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Used By?</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="department">Department</SelectItem>
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
                    <FormLabel>Maintenance Team? *</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value || "")} value={field.value || undefined}>
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

              <FormField
                control={form.control}
                name="department_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department?</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
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
                name="assigned_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned Date?</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
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
                      <Textarea {...field} rows={4} placeholder="Enter description..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="default_technician_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Technician?</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select technician" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.filter((u) => u.role === "technician" || u.role === "manager").map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name}
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
                name="assigned_to_user_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee?</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name}
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
                name="scrap_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scrap Date?</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="used_in_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Used in location?</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Location where equipment is used" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="work_center_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Center?</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select work center" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {workCenters.map((wc) => (
                          <SelectItem key={wc.id} value={wc.id.toString()}>
                            {wc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving..." : equipmentId ? "Update Equipment" : "Create Equipment"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
