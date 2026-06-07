import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface DayStats {
  date: string;
  revenue: number;
  profit: number;
  count: number;
}

export interface TopProduct {
  label: string;
  revenue: number;
  profit: number;
  count: number;
}

export interface PaymentStats {
  method: string;
  count: number;
  revenue: number;
}

export interface StatsSummary {
  totalSales: number;
  totalRevenue: string;
  totalCost: string;
  totalProfit: string;
  margin: string;
}

export interface Stats {
  summary: StatsSummary;
  byDay: DayStats[];
  topProducts: TopProduct[];
  byPayment: PaymentStats[];
}

export function useStats(from: string, to: string) {
  return useQuery({
    queryKey: ["stats", from, to],
    queryFn: async () => {
      const { data } = await api.get<Stats>("/sales/stats", { params: { from, to } });
      return data;
    },
    enabled: !!from && !!to,
  });
}
