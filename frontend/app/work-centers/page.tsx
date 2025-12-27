"use client";

import { useEffect, useState } from "react";
import { workCentersAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { WorkCenterForm } from "@/components/work-centers/work-center-form";

export default function WorkCentersPage() {
  const [workCenters, setWorkCenters] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedWorkCenterId, setSelectedWorkCenterId] = useState<number | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    loadWorkCenters();
  }, [search]);

  async function loadWorkCenters() {
    try {
      setLoading(true);
      const params: any = {};
      if (search && search.trim() !== "") {
        params.search = search.trim();
      }
      const data = await workCentersAPI.getAll(params);
      console.log("Work centers loaded:", data?.length || 0);
      setWorkCenters(data || []);
    } catch (error) {
      console.error("Failed to load work centers:", error);
      setWorkCenters([]);
    } finally {
      setLoading(false);
    }
  }

  function handleWorkCenterClick(workCenterId: number) {
    setSelectedWorkCenterId(workCenterId);
    setOpenDialog(true);
  }

  function handleNewWorkCenter() {
    setSelectedWorkCenterId(null);
    setOpenDialog(true);
  }

  function handleSuccess() {
    loadWorkCenters();
    setOpenDialog(false);
    setSelectedWorkCenterId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Work Center</h1>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button onClick={handleNewWorkCenter}>
              <Plus className="mr-2 h-4 w-4" />
              New
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedWorkCenterId ? "Edit Work Center" : "New Work Center"}</DialogTitle>
              <DialogDescription>
                {selectedWorkCenterId ? "Update work center information" : "Create a new work center"}
              </DialogDescription>
            </DialogHeader>
            <WorkCenterForm 
              workCenterId={selectedWorkCenterId || undefined} 
              onSuccess={handleSuccess} 
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Work Center List</CardTitle>
          <CardDescription>{workCenters.length} work centers found</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Work Center</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Tag</TableHead>
                  <TableHead>Alternative Workcenters</TableHead>
                  <TableHead>Cost per hour</TableHead>
                  <TableHead>Capacity Time Efficiency</TableHead>
                  <TableHead>OEE Target</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workCenters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No work centers found
                    </TableCell>
                  </TableRow>
                ) : (
                  workCenters.map((wc) => (
                    <TableRow 
                      key={wc.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleWorkCenterClick(wc.id)}
                    >
                      <TableCell className="font-medium">{wc.name}</TableCell>
                      <TableCell>{wc.code || "-"}</TableCell>
                      <TableCell>{wc.tag || "-"}</TableCell>
                      <TableCell>{wc.alternative_workcenters || "-"}</TableCell>
                      <TableCell>{wc.cost_per_hour ? `$${parseFloat(wc.cost_per_hour).toFixed(2)}` : "-"}</TableCell>
                      <TableCell>{wc.capacity_time_efficiency ? `${parseFloat(wc.capacity_time_efficiency).toFixed(2)}%` : "-"}</TableCell>
                      <TableCell>{wc.oee_target ? `${parseFloat(wc.oee_target).toFixed(2)}%` : "-"}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit Work Center</DialogTitle>
                              <DialogDescription>Update work center information</DialogDescription>
                            </DialogHeader>
                            <WorkCenterForm workCenterId={wc.id} onSuccess={handleSuccess} />
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

