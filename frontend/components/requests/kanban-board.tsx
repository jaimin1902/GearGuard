"use client";

import { useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock } from "lucide-react";
import Link from "next/link";

const statuses = [
  { id: "new", label: "New", color: "bg-gray-50", borderColor: "border-gray-200", textColor: "text-gray-700" },
  { id: "in_progress", label: "In Progress", color: "bg-blue-50", borderColor: "border-blue-200", textColor: "text-blue-700" },
  { id: "repaired", label: "Repaired", color: "bg-green-50", borderColor: "border-green-200", textColor: "text-green-700" },
  { id: "scrapped", label: "Scrapped", color: "bg-red-50", borderColor: "border-red-200", textColor: "text-red-700" },
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

  return <div ref={setNodeRef} className="h-full">{children}</div>;
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

  const isOverdue = request.is_overdue || (request.scheduled_date && new Date(request.scheduled_date) < new Date() && request.status !== "repaired" && request.status !== "scrapped");

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className={`mb-3 cursor-move hover:shadow-md transition-shadow border border-gray-200 ${
        isOverdue ? "border-l-4 border-l-red-500" : ""
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm font-medium text-gray-900 line-clamp-2">{request.subject}</CardTitle>
            {isOverdue && (
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            )}
          </div>
          <CardDescription className="text-xs text-gray-600 mt-1">
            {request.equipment_name || request.work_center_name || "N/A"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <div className="flex items-center justify-between">
            <Badge 
              variant={request.request_type === "preventive" ? "default" : "secondary"}
              className="text-xs"
            >
              {request.request_type === "preventive" ? "Preventive" : "Corrective"}
            </Badge>
            {request.assigned_to_avatar ? (
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                  {request.assigned_to_name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
            ) : request.assigned_to_name ? (
              <span className="text-xs text-gray-600 font-medium">{request.assigned_to_name}</span>
            ) : (
              <span className="text-xs text-gray-400">Unassigned</span>
            )}
          </div>
          {request.scheduled_date && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Clock className="h-3 w-3" />
              <span>{new Date(request.scheduled_date).toLocaleDateString()}</span>
            </div>
          )}
          <Button 
            asChild 
            variant="ghost" 
            size="sm" 
            className="w-full mt-2 h-8 text-xs" 
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
    
    // Check if dropped on a status column
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
          <div key={status.id} className="min-h-[600px]">
            <Card className={`${status.color} ${status.borderColor} border-2 h-full flex flex-col`}>
              <CardHeader className="pb-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <CardTitle className={`text-base font-semibold ${status.textColor}`}>
                    {status.label}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {columns[status.id]?.length || 0}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 flex-1 overflow-y-auto">
                <DroppableColumn statusId={status.id}>
                  <SortableContext 
                    items={columns[status.id]?.map((r) => r.id.toString()) || []} 
                    strategy={verticalListSortingStrategy}
                  >
                    {columns[status.id]?.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        No requests
                      </div>
                    ) : (
                      columns[status.id]?.map((request) => (
                        <RequestCard key={request.id} request={request} onStatusChange={onStatusChange} />
                      ))
                    )}
                  </SortableContext>
                </DroppableColumn>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
      <DragOverlay>
        {activeRequest ? (
          <Card className="w-64 opacity-90 shadow-lg border-2 border-blue-500">
            <CardHeader>
              <CardTitle className="text-sm">{activeRequest.subject}</CardTitle>
            </CardHeader>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
