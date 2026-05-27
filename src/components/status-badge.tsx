import { Badge } from "@/components/ui/badge";
import { ItemStatus, STATUS_COLORS } from "@/lib/types";

interface StatusBadgeProps {
  status: ItemStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colorClass =
    STATUS_COLORS[status] ??
    "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  return (
    <Badge variant="secondary" className={`${colorClass} font-medium`}>
      {status}
    </Badge>
  );
}
