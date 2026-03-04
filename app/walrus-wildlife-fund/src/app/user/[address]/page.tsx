"use client";

import { useParams } from "next/navigation";
import { DashboardView } from "@/components/dashboard-view";

export default function UserDashboardPage() {
  const params = useParams<{ address: string }>();
  const address = typeof params?.address === "string" ? params.address : "";
  return <DashboardView address={address} />;
}
