"use client";

import { RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ParkingStatus as ParkingStatusType } from "@/services/api";

interface ParkingStatusComponentProps {
  status: ParkingStatusType | null;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function ParkingStatusDisplay({
  status,
  onRefresh,
  isLoading = false
}: ParkingStatusComponentProps) {
  if (!status) return null;

  return (
    <div className="fixed top-2 right-2 z-50 bg-card/80 backdrop-blur-lg border border-border/30 px-3 py-2 rounded-lg text-xs shadow-md">
      <div className="flex items-center gap-2 mb-1">
        <div className="font-medium">Parking Status</div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-5 w-5 rounded-full"
                onClick={onRefresh}
                disabled={isLoading}
              >
                <RefreshCwIcon className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Refresh data</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="flex flex-col space-y-0.5">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Occupied:</span>
          <span>
            {status.occupied_slots}/{status.total_slots}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Available:</span>
          <span>{status.available_slots}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Floor:</span>
          <span>{status.floor}</span>
        </div>
        {status.waitlist_count > 0 && (
          <div className="flex justify-between gap-4 text-amber-500">
            <span>Waitlist:</span>
            <span>{status.waitlist_count}</span>
          </div>
        )}
      </div>
    </div>
  );
}