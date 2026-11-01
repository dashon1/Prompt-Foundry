import { useQuery } from "@tanstack/react-query";

export function ServiceStatus() {
  const { data: available, isError } = useQuery({
    queryKey: ["service-status"],
    queryFn: async () => (await fetch("/api/health", { credentials: "include" })).ok,
    staleTime: 10000,
    refetchInterval: 30000,
  });

  if (available !== false && !isError) return null;

  return (
    <div role="alert" className="border-b border-destructive/40 bg-destructive/10 px-6 py-3 text-sm">
      <div className="container mx-auto">
        Database service is currently unavailable. Sign-in, generation, and saved content may not work until the connection is restored.
      </div>
    </div>
  );
}
