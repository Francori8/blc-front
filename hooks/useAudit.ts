import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AuditLog, AuditModule, Paginated } from "@/types";

export function useAuditLogs(module?: AuditModule, userId?: string, page?: number, limit?: number) {
  return useQuery({
    queryKey: ["audit", module, userId, page, limit],
    queryFn: async () => {
      const { data } = await api.get<Paginated<AuditLog>>("/audit", {
        params: {
          ...(module ? { module } : {}),
          ...(userId ? { userId } : {}),
          page,
          limit,
        },
      });
      return data;
    },
  });
}
