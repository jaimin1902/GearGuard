"use client";

import { useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

const statuses = [
  { id: "new", label: "New", color: "bg-gray-100" },
  { id: "in_progress", label: "In Progress", color: "bg-blue-100" },
  { id: "repaired", label: "Repaired", color: "bg-green-100" },
  { id: "scrapped", label: "Scrapped", color: "bg-red-100" },
];

interface KanbanBoardProps {
  requests: any[];
  onStatusChange: (requestId: number, newStatus: string) => void;
  onRefresh: () => void;
}

function DroppableColumn({ statusId, children }: { statusId: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({
    id: statusId,
  });

  return <div ref={setNodeRef}>{children}</div>;
}

function RequestCard({ request, onStatusChange }: { request: any; onStatusChange: (id: number, status: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: request.id.toString(),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className={`mb-2 cursor-move ${request.is_overdue ? "border-l-4 border-l-red-500" : ""}`}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-sm">{request.subject}</CardTitle>
            {request.is_overdue && (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
          </div>
          <CardDescription className="text-xs">{request.equipment_name}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <Badge variant={request.request_type === "preventive" ? "default" : "secondary"}>
              {request.request_type}
            </Badge>
            {request.assigned_to_avatar ? (
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {request.assigned_to_name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
            ) : request.assigned_to_name ? (
              <span className="text-xs text-muted-foreground">{request.assigned_to_name}</span>
            ) : null}
          </div>
          {request.scheduled_date && (
            <p className="text-xs text-muted-foreground mt-2">
              Scheduled: {new Date(request.scheduled_date).toLocaleDateString()}
            </p>
          )}
          <Button 
            asChild 
            variant="ghost" 
            size="sm" 
            className="w-full mt-2" 
            onClick={(e) => e.stopPropagation()}
          >
            <Link href={`/requests/${request.id}`}>View Details</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function KanbanBoard({ requests, onStatusChange, onRefresh }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Group requests by status
  const columns: Record<string, any[]> = {
    new: [],
    in_progress: [],
    repaired: [],
    scrapped: [],
  };
  
  requests.forEach((request) => {
    if (columns[request.status]) {
      columns[request.status].push(request);
    }
  });

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const requestId = parseInt(active.id as string);
    let newStatus = over.id as string;
    
    // Check if dropped on a status column (the div with data-status)
    const targetStatus = statuses.find((s) => s.id === newStatus);
    if (targetStatus) {
      onStatusChange(requestId, newStatus);
      return;
    }
    
    // If dropped on a card, find which column it belongs to
    const targetColumn = Object.keys(columns).find((col) => 
      columns[col].some((r) => r.id.toString() === over.id.toString())
    );
    if (targetColumn) {
      onStatusChange(requestId, targetColumn);
    }
  }

  const activeRequest = activeId ? requests.find((r) => r.id.toString() === activeId) : null;

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statuses.map((status) => (
          <div key={status.id} className="min-h-[500px]">
            <Card className={`${status.color} h-full`}>
              <CardHeader>
                <CardTitle className="text-lg">{status.label}</CardTitle>
                <CardDescription>
                  {columns[status.id]?.length || 0} requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DroppableColumn statusId={status.id}>
                  <SortableContext 
                    items={columns[status.id]?.map((r) => r.id.toString()) || []} 
                    strategy={verticalListSortingStrategy}
                  >
                    {columns[status.id]?.map((request) => (
                      <RequestCard key={request.id} request={request} onStatusChange={onStatusChange} />
                    ))}
                  </SortableContext>
                </DroppableColumn>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
      <DragOverlay>
        {activeRequest ? (
          <Card className="w-64 opacity-90">
            <CardHeader>
              <CardTitle className="text-sm">{activeRequest.subject}</CardTitle>
            </CardHeader>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

