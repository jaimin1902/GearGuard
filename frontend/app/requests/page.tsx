"use client";

import { useEffect, useState } from "react";
import { requestsAPI, equipmentAPI, teamsAPI, usersAPI } from "@/lib/api";
import { KanbanBoard } from "@/components/requests/kanban-board";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { RequestForm } from "@/components/requests/request-form";

export default function RequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    try {
      setLoading(true);
      const data = await requestsAPI.getAll();
      setRequests(data);
    } catch (error) {
      console.error("Failed to load requests:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(requestId: number, newStatus: string) {
    try {
      await requestsAPI.update(requestId, { status: newStatus });
      loadRequests();
    } catch (error) {
      console.error("Failed to update request:", error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Maintenance Requests</h1>
          <p className="text-muted-foreground">Manage and track maintenance work orders</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Maintenance Request</DialogTitle>
              <DialogDescription>Create a new maintenance request for Equipment or Work Center</DialogDescription>
            </DialogHeader>
            <RequestForm onSuccess={() => { loadRequests(); }} />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-8 text-center">Loading...</CardContent>
        </Card>
      ) : (
        <KanbanBoard requests={requests} onStatusChange={handleStatusChange} onRefresh={loadRequests} />
      )}
    </div>
  );
}

