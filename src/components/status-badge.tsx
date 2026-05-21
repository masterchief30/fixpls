import { Badge } from "@/components/ui/badge";
import { ItemStatus, STATUS_COLORS } from "@/lib/types";

interface StatusBadgeProps {
  status: ItemStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant="secondary" className={`${STATUS_COLORS[status]} font-medium`}>
      {status}
    </Badge>
  );
}
