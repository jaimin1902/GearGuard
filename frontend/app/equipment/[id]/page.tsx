"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { equipmentAPI } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { EquipmentForm } from "@/components/equipment/equipment-form";

export default function EquipmentDetailPage() {
  const params = useParams();
  const id = parseInt(params.id as string);
  const [equipment, setEquipment] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      setLoading(true);
      const [equipData, requestsData] = await Promise.all([
        equipmentAPI.getById(id),
        equipmentAPI.getRequests(id),
      ]);
      setEquipment(equipData);
      setRequests(requestsData);
    } catch (error) {
      console.error("Failed to load equipment:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!equipment) {
    return <div className="text-center py-8">Equipment not found</div>;
  }

  const openRequests = requests.filter((r) => r.status === "new" || r.status === "in_progress");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">New Equipment</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <EquipmentForm 
            equipmentId={id} 
            onSuccess={() => { loadData(); }} 
            openRequestsCount={openRequests.length}
          />
        </CardContent>
      </Card>

    </div>
  );
}

