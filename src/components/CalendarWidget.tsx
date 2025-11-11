import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarWidgetProps {
  onClose: () => void;
}

export const CalendarWidget = ({ onClose }: CalendarWidgetProps) => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <Card className="fixed top-20 left-4 p-4 shadow-xl z-50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Calendar</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-md border"
      />
    </Card>
  );
};
