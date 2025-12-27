"use client";

import { TeamForm } from "@/components/teams/team-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { teamsAPI } from "@/lib/api";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";

export default function TeamsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeams();
  }, []);

  async function loadTeams() {
    try {
      setLoading(true);
      const data = await teamsAPI.getAll();
      setTeams(data);
    } catch (error) {
      console.error("Failed to load teams:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#374151]">Teams</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-[#714B67] hover:bg-[#714B67] hover:text-white">
              <Plus className="mr-2 h-4 w-4" />
              New Teams
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[#374151]">New Team</DialogTitle>
              <DialogDescription>
                Create a new team
              </DialogDescription>
            </DialogHeader>
            <TeamForm
              onSuccess={() => {
                loadTeams();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#374151]">Teams</CardTitle>
          <CardDescription className="text-[#374151]">{teams.length} teams found</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-[#374151]">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[#374151]">Team Name</TableHead>
                  <TableHead className="text-[#374151]">Team Members</TableHead>
                  <TableHead className="text-[#374151]">Company</TableHead>
                  <TableHead className="text-[#374151]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium text-[#374151]">{team.name}</TableCell>
                    <TableCell className="text-[#374151]">{team.team_members || "-"}</TableCell>
                    <TableCell className="text-[#374151]">{team.company || "-"}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-[#374151] hover:bg-[#714B67] hover:text-white">
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="text-[#374151]">Edit Team</DialogTitle>
                            <DialogDescription>
                              Update team information
                            </DialogDescription>
                          </DialogHeader>
                          <TeamForm
                            teamId={team.id}
                            onSuccess={() => {
                              loadTeams();
                            }}
                          />
                        </DialogContent>
                      </Dialog>
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
