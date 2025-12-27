"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { teamsAPI } from "@/lib/api";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const teamSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  company: z.string().optional(),
});

type TeamFormValues = z.infer<typeof teamSchema>;

interface TeamFormProps {
  teamId?: number;
  onSuccess: () => void;
}

export function TeamForm({ teamId, onSuccess }: TeamFormProps) {
  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
      description: "",
      company: "",
    },
  });

  useEffect(() => {
    if (teamId) {
      loadTeam();
    }
  }, [teamId]);

  async function loadTeam() {
    try {
      const data = await teamsAPI.getById(teamId!);
      form.reset({
        name: data.name || "",
        description: data.description || "",
        company: data.company || "",
      });
    } catch (error) {
      console.error("Failed to load team:", error);
    }
  }

  async function onSubmit(values: TeamFormValues) {
    try {
      if (teamId) {
        await teamsAPI.update(teamId, values);
      } else {
        await teamsAPI.create(values);
      }
      onSuccess();
      form.reset();
    } catch (error) {
      console.error("Failed to save team:", error);
      alert("Failed to save team. Please try again.");
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
              <FormLabel>Team Name *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., Mechanics, Electricians, IT Support" />
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
                <Textarea {...field} placeholder="Team description (optional)" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., My Company (San Francisco)" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          {teamId ? "Update Team" : "Create Team"}
        </Button>
      </form>
    </Form>
  );
}

