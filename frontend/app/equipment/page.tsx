"use client";

import { useEffect, useState } from "react";
import { equipmentAPI, departmentsAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search } from "lucide-react";
import { EquipmentForm } from "@/components/equipment/equipment-form";

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(
    null
  );
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, [search, filterDept]);

  async function loadData() {
    try {
      setLoading(true);
      const [equipData, deptData] = await Promise.all([
        equipmentAPI.getAll({ search, department_id: filterDept || undefined }),
        departmentsAPI.getAll(),
      ]);
      setEquipment(equipData);
      setDepartments(deptData);
    } catch (error) {
      console.error("Failed to load equipment:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleEquipmentClick(equipmentId: number) {
    setSelectedEquipmentId(equipmentId);
    setOpenDialog(true);
  }

  function handleNewEquipment() {
    setSelectedEquipmentId(null);
    setOpenDialog(true);
  }

  function handleSuccess() {
    loadData();
    setOpenDialog(false);
    setSelectedEquipmentId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Equipment</h1>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button onClick={handleNewEquipment}>
              <Plus className="mr-2 h-4 w-4" />
              New
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Equipment</DialogTitle>
            </DialogHeader>
            <EquipmentForm
              equipmentId={selectedEquipmentId || undefined}
              onSuccess={handleSuccess}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, serial, category..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card> */}

      <Card>
        <CardHeader>
          <CardTitle>Equipment List</CardTitle>
          <CardDescription>
            {equipment.length} equipment items found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipment Name</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Equipment Category</TableHead>
                  <TableHead>Company</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipment.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleEquipmentClick(item.id)}
                  >
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.assigned_to_name || "-"}</TableCell>
                    <TableCell>{item.department_name || "-"}</TableCell>
                    <TableCell>{item.serial_number || "-"}</TableCell>
                    <TableCell>{item.default_technician_name || "-"}</TableCell>
                    <TableCell>
                      {item.equipment_category_name || item.category || "-"}
                    </TableCell>
                    <TableCell>{item.company || "-"}</TableCell>
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
