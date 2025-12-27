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
        <h1 className="text-3xl font-bold text-[#374151]">Reports</h1>
        <p className=" text-[#374151]">Analytics and statistics for maintenance requests</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#374151]">Request Statistics</CardTitle>
          <CardDescription>View statistics grouped by team or equipment category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Select value={groupBy} onValueChange={(value: "team" | "equipment_category") => setGroupBy(value)}>
              <SelectTrigger className="w-64 text-[#374151]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="team" className="text-[#374151]">Group by Team</SelectItem>
                <SelectItem value="equipment_category" className="text-[#374151]">Group by Equipment Category</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-8 text-[#374151]">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[#374151]">{groupBy === "team" ? "Team Name" : "Equipment Category"}</TableHead>
                  <TableHead className="text-[#374151]">Total Requests</TableHead>
                  <TableHead className="text-[#374151]">New</TableHead>
                  <TableHead className="text-[#374151]">In Progress</TableHead>
                  <TableHead className="text-[#374151]">Repaired</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statistics.map((stat, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium text-[#374151]">{stat.group_name || "Uncategorized"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[#374151]">{stat.total_requests}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[#374151]">{stat.new_count || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[#374151]">{stat.in_progress_count || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className=" bg-[#714B67] text-white">{stat.repaired_count || 0}</Badge>
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

