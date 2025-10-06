"use client";

import React, { useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./calendar.css"; // Custom styles
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircleIcon, CalendarDaysIcon, ClockIcon, MapPinIcon, UsersIcon } from "lucide-react";

// Setup the localizer for react-big-calendar
const localizer = momentLocalizer(moment);

// Sample event data (replace with real data from API)
const sampleEvents = [
  {
    id: 1,
    title: "Tiếng Anh A1.1 - Buổi 1",
    start: new Date(2024, 9, 29, 9, 0), // October 29, 2024, 9:00 AM
    end: new Date(2024, 9, 29, 10, 30),
    resource: {
      className: "A1.1-FND-01",
      teacher: "Nguyễn Văn A",
      room: "Phòng 101",
      campus: "Trung tâm HCM",
      type: "offline",
      attendance: 15,
      totalStudents: 20,
    },
  },
  {
    id: 2,
    title: "Tiếng Anh B2.2 - Buổi 3",
    start: new Date(2024, 9, 30, 14, 0),
    end: new Date(2024, 9, 30, 15, 30),
    resource: {
      className: "B2.2-INT-02",
      teacher: "Trần Thị B",
      room: "Zoom Meeting",
      campus: "Online",
      type: "online",
      attendance: 18,
      totalStudents: 20,
    },
  },
];

const ScheduleCalendar = () => {
  const [events, setEvents] = useState(sampleEvents);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Custom event component
  const EventComponent = ({ event }) => (
    <div className={`text-xs p-1 rbc-event ${event.resource.type}-event`}>
      <div className="font-semibold truncate">{event.title}</div>
      <div className="flex items-center gap-1">
        <ClockIcon className="h-3 w-3" />
        {moment(event.start).format("HH:mm")}
      </div>
      <Badge variant={event.resource.type === "online" ? "secondary" : "default"} className="text-xs">
        {event.resource.type}
      </Badge>
    </div>
  );

  // Handle event selection
  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
  };

  // Handle slot selection (for creating new events)
  const handleSelectSlot = ({ start, end }) => {
    // Here you would open a modal to create a new session
    console.log("Selected slot:", { start, end });
  };

  // Handle event move (drag and drop)
  const handleEventDrop = ({ event, start, end }) => {
    // Check for conflicts
    const hasConflict = events.some(e =>
      e.id !== event.id &&
      ((start >= e.start && start < e.end) || (end > e.start && end <= e.end) || (start <= e.start && end >= e.end))
    );

    if (hasConflict) {
      alert("Lịch bị trùng! Vui lòng chọn thời gian khác.");
      return;
    }

    // Update event
    const updatedEvents = events.map(e =>
      e.id === event.id ? { ...e, start, end } : e
    );
    setEvents(updatedEvents);
  };

  return (
    <div className="flex gap-6">
      {/* Calendar */}
      <div className="flex-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDaysIcon className="h-5 w-5" />
              Lịch học lớp học
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: "600px" }}>
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                selectable
                onSelectEvent={handleSelectEvent}
                onSelectSlot={handleSelectSlot}
                onEventDrop={handleEventDrop}
                components={{
                  event: EventComponent,
                }}
                views={["month", "week", "day", "agenda"]}
                defaultView="week"
                step={30}
                showMultiDayTimes
                resizable
                popup
                messages={{
                  next: "Tiếp",
                  previous: "Trước",
                  today: "Hôm nay",
                  month: "Tháng",
                  week: "Tuần",
                  day: "Ngày",
                  agenda: "Lịch trình",
                  date: "Ngày",
                  time: "Thời gian",
                  event: "Sự kiện",
                  noEventsInRange: "Không có buổi học nào trong khoảng thời gian này.",
                  showMore: (total) => `+ Xem thêm ${total} buổi`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Details Sidebar */}
      <div className="w-80">
        <Card>
          <CardHeader>
            <CardTitle>Chi tiết buổi học</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedEvent ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedEvent.title}</h3>
                  <Badge variant={selectedEvent.resource.type === "online" ? "secondary" : "default"}>
                    {selectedEvent.resource.type === "online" ? "Online" : "Offline"}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4" />
                    <span>
                      {moment(selectedEvent.start).format("HH:mm")} - {moment(selectedEvent.end).format("HH:mm")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CalendarDaysIcon className="h-4 w-4" />
                    <span>{moment(selectedEvent.start).format("DD/MM/YYYY")}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <UsersIcon className="h-4 w-4" />
                    <span>Giảng viên: {selectedEvent.resource.teacher}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4" />
                    <span>{selectedEvent.resource.room} - {selectedEvent.resource.campus}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <UsersIcon className="h-4 w-4" />
                    <span>Điểm danh: {selectedEvent.resource.attendance}/{selectedEvent.resource.totalStudents}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    Chỉnh sửa
                  </Button>
                  <Button size="sm" variant="outline">
                    Điểm danh
                  </Button>
                  <Button size="sm" variant="outline">
                    Báo cáo
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Chọn một buổi học để xem chi tiết</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Thao tác nhanh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" variant="outline">
              <PlusCircleIcon className="mr-2 h-4 w-4" />
              Tạo buổi học mới
            </Button>
            <Button className="w-full" variant="outline">
              Đồng bộ với Google Calendar
            </Button>
            <Button className="w-full" variant="outline">
              Xuất lịch PDF
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ScheduleCalendar;