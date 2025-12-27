"use client";

import { useEffect, useState } from "react";
import { requestsAPI } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ReportsPage() {
  const [groupBy, setGroupBy] = useState<"team" | "equipment_category">("team");
  const [statistics, setStatistics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, [groupBy]);

  async function loadStatistics() {
    try {
      setLoading(true);
      const data = await requestsAPI.getStatistics(groupBy);
      setStatistics(data);
    } catch (error) {
      console.error("Failed to load statistics:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Analytics and statistics for maintenance requests</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Statistics</CardTitle>
          <CardDescription>View statistics grouped by team or equipment category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Select value={groupBy} onValueChange={(value: "team" | "equipment_category") => setGroupBy(value)}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="team">Group by Team</SelectItem>
                <SelectItem value="equipment_category">Group by Equipment Category</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{groupBy === "team" ? "Team Name" : "Equipment Category"}</TableHead>
                  <TableHead>Total Requests</TableHead>
                  <TableHead>New</TableHead>
                  <TableHead>In Progress</TableHead>
                  <TableHead>Repaired</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statistics.map((stat, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{stat.group_name || "Uncategorized"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{stat.total_requests}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{stat.new_count || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{stat.in_progress_count || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">{stat.repaired_count || 0}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

