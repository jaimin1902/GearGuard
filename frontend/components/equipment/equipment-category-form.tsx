"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { equipmentCategoriesAPI, usersAPI } from "@/lib/api";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  responsible_user_id: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface EquipmentCategoryFormProps {
  categoryId?: number;
  onSuccess: () => void;
}

export function EquipmentCategoryForm({ categoryId, onSuccess }: EquipmentCategoryFormProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      responsible_user_id: "",
    },
  });

  useEffect(() => {
    loadOptions();
    if (categoryId) {
      loadCategory();
    }
  }, [categoryId]);

  async function loadOptions() {
    try {
      const usersData = await usersAPI.getAll();
      setUsers(usersData);
    } catch (error) {
      console.error("Failed to load options:", error);
    }
  }

  async function loadCategory() {
    try {
      const data = await equipmentCategoriesAPI.getById(categoryId!);
      form.reset({
        name: data.name || "",
        responsible_user_id: data.responsible_user_id?.toString() || "",
      });
    } catch (error) {
      console.error("Failed to load category:", error);
    }
  }

  async function onSubmit(values: CategoryFormValues) {
    try {
      setLoading(true);
      const payload = {
        ...values,
        responsible_user_id: values.responsible_user_id ? parseInt(values.responsible_user_id) : null,
      };

      if (categoryId) {
        await equipmentCategoriesAPI.update(categoryId, payload);
      } else {
        await equipmentCategoriesAPI.create(payload);
      }
      onSuccess();
    } catch (error: any) {
      console.error("Failed to save category:", error);
      alert(error.message || "Failed to save category. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., Computers, Monitors" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="responsible_user_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Responsible</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || undefined}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select responsible user" />
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

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Saving..." : categoryId ? "Update Category" : "Create Category"}
        </Button>
      </form>
    </Form>
  );
}

