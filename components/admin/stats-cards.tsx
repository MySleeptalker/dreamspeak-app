"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, Heart, Clock } from "lucide-react";
import { DreamspeakUser } from "@/types";
import { differenceInDays } from "date-fns";

export function StatsCards({ users }: { users: DreamspeakUser[] }) {
  const total = users.length;
  const paid = users.filter((u) => u.plan === "paid").length;
  const free = total - paid;
  const avgHearts = total ? (users.filter((u) => u.plan === "free").reduce((sum, u) => sum + u.hearts, 0) / Math.max(free, 1)).toFixed(1) : "0";
  const avgTenure = total ? Math.round(users.reduce((sum, u) => sum + differenceInDays(new Date(), new Date(u.firstSeenAt)), 0) / total) : 0;

  const cards = [
    { title: "Total Users", value: total.toString(), description: `${free} free · ${paid} paid`, icon: Users },
    { title: "Paid Conversion", value: total ? `${Math.round((paid / total) * 100)}%` : "0%", description: `${paid} on Dreamspeak Plus`, icon: CreditCard },
    { title: "Avg. Hearts (Free)", value: avgHearts, description: "Across free-plan users", icon: Heart },
    { title: "Avg. Time on App", value: `${avgTenure}d`, description: "Days since signup, avg.", icon: Clock },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
            <c.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{c.value}</div>
            <p className="text-xs text-muted-foreground">{c.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
