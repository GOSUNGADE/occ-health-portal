"use client";

import { useEffect, useState } from "react";

type DashboardStats = {
  assigned_today: number;
  pending_assessments: number;
  completed_this_week: number;
};

export default function ClinicianDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    assigned_today: 0,
    pending_assessments: 0,
    completed_this_week: 0,
  });

  useEffect(() => {
    async function loadDashboard() {
      const res = await fetch("/api/clinician/dashboard", {
        cache: "no-store",
      });

      const data = await res.json();

      if (res.ok) {
        setStats({
          assigned_today: Number(data.assigned_today || 0),
          pending_assessments: Number(data.pending_assessments || 0),
          completed_this_week: Number(data.completed_this_week || 0),
        });
      }
    }

    loadDashboard();
  }, []);

  return (
    <div className="space-y-6">
      ...rest of your JSX unchanged...
    </div>
  );
}