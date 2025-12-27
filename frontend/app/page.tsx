"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { dashboardAPI } from "@/lib/api";
import { Plus, Search, ChevronDown, AlertTriangle, Users, FileText } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RequestForm } from "@/components/requests/request-form";

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    criticalEquipment: { count: 0, threshold: 30 },
    technicianLoad: { utilization: 0, assigned: 0, total: 0 },
    openRequests: { pending: 0, overdue: 0 },
  });
  const [tableData, setTableData] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    loadDashboard();
  }, [router]);

  useEffect(() => {
    if (search !== undefined) {
      loadTable();
    }
  }, [search]);

  async function loadDashboard() {
    try {
      setLoading(true);
      const [statsData, tableDataResult] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getTable(),
      ]);
      setStats(statsData);
      setTableData(tableDataResult);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadTable() {
    try {
      const result = await dashboardAPI.getTable(search || undefined);
      setTableData(result);
    } catch (error) {
      console.error("Failed to load table:", error);
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-[#374151]">Dashboard</h1>
      </div>
      <div className="flex items-center justify-between gap-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-[#714B67] hover:bg-[#714B67] hover:text-white">
              <Plus className="mr-2 h-4 w-4" />
              New
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[#374151]">Create Maintenance Request</DialogTitle>
              <DialogDescription>Create a new maintenance request for Equipment or Work Center</DialogDescription>
            </DialogHeader>
            <RequestForm onSuccess={() => { loadDashboard(); }} />
          </DialogContent>
        </Dialog>

        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button variant="outline" size="icon">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Critical Equipment Card - Red */}
        <Card className="border-red-300 bg-red-50 dark:bg-red-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Critical Equipment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {loading ? "..." : stats.criticalEquipment.count} Units
            </div>
            <p className="text-sm text-muted-foreground mt-1">(Health &lt; 30%)</p>
            <p className="text-xs text-muted-foreground mt-2">
              At-risk machines needing immediate attention
            </p>
          </CardContent>
        </Card>

        {/* Technician Load Card - Blue */}
        <Card className="border-blue-300 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Technician Load
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {loading ? "..." : stats.technicianLoad.utilization}% Utilized
            </div>
            <p className="text-sm text-muted-foreground mt-1">(Assign Carefully)</p>
            <p className="text-xs text-muted-foreground mt-2">
              Workforce utilization percentage
            </p>
          </CardContent>
        </Card>

        {/* Open Requests Card - Green */}
        <Card className="border-green-300 bg-green-50 dark:bg-green-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Open Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {loading ? "..." : stats.openRequests.pending} Pending
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.openRequests.overdue} Overdue
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Current request status breakdown
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#374151]">Maintenance Requests</CardTitle>
          <CardDescription className="text-[#374151]">Recent maintenance requests and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[#374151]">Subjects</TableHead>
                  <TableHead className="text-[#374151]">Employee</TableHead>
                  <TableHead className="text-[#374151]">Technician</TableHead>
                  <TableHead className="text-[#374151]">Category</TableHead>
                  <TableHead className="text-[#374151]">Stage</TableHead>
                  <TableHead className="text-[#374151]">Company</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  tableData.map((row) => (
                    <TableRow key={row.id} className="cursor-pointer hover:bg-muted/50" onClick={() => window.location.href = `/requests/${row.id}`}>
                      <TableCell className="font-medium text-[#374151]">{row.subject || "N/A"}</TableCell>
                      <TableCell className="text-[#374151]">{row.employee_name || "N/A"}</TableCell>
                      <TableCell className="text-[#374151]">{row.technician_name || "Unassigned"}</TableCell>
                        <TableCell className="text-[#374151]">{row.equipment_category || "N/A"}</TableCell>
                      <TableCell className="text-[#374151]">
                        <Badge
                          variant={
                            row.status === "repaired"
                              ? "default"
                              : row.status === "in_progress"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {row.status === "new"
                            ? "New Request"
                            : row.status === "in_progress"
                            ? "In Progress"
                            : row.status === "repaired"
                            ? "Repaired"
                            : row.status || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[#374151]">{row.company_name || "My Company"}</TableCell>
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
