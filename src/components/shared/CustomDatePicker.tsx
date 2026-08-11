import { DatePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { Calendar, ChevronDown } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Button from "../ui/Button";

const { RangePicker } = DatePicker;

interface CustomDatePickerProps {
  selectedData?: [string | null, string | null];
  onChange?: (dates: [string | null, string | null]) => void;
  isDisabled?: boolean;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  selectedData,
  onChange,
  isDisabled = false,
}) => {
  const [visible, setVisible] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [dates, setDates] = useState<[Dayjs | null, Dayjs | null]>([
    selectedData?.[0] ? dayjs(selectedData[0]) : null,
    selectedData?.[1] ? dayjs(selectedData[1]) : null,
  ]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const menuItems = useMemo(() => {
    const today = dayjs();
    const yesterday = today.subtract(1, "day");
    const tomorrow = today.add(1, "day");
    const startOfWeek = today.startOf("week");
    const endOfWeek = today.endOf("week").add(1, "day");
    const lastWeekStart = startOfWeek.subtract(1, "week");
    const lastWeekEnd = lastWeekStart.add(7, "day");
    const startOfMonth = today.startOf("month");
    const endOfMonth = today.endOf("month").add(1, "day");
    const lastMonthStart = today.subtract(1, "month").startOf("month");
    const lastMonthEnd = today
      .subtract(1, "month")
      .endOf("month")
      .add(1, "day");
    const startOfYear = today.startOf("year");
    const endOfCurrentMonth = today.endOf("year").add(1, "day");
    const lastYearStart = today.subtract(1, "year").startOf("year");
    const lastYearEnd = today.subtract(1, "year").endOf("year").add(1, "day");

    return [
      { key: "today", label: "Today", range: [today, tomorrow] },
      { key: "yesterday", label: "Yesterday", range: [yesterday, today] },
      { key: "this-week", label: "This Week", range: [startOfWeek, endOfWeek] },
      {
        key: "last-week",
        label: "Last Week",
        range: [lastWeekStart, lastWeekEnd],
      },
      {
        key: "this-month",
        label: "This Month",
        range: [startOfMonth, endOfMonth],
      },
      {
        key: "last-month",
        label: "Last Month",
        range: [lastMonthStart, lastMonthEnd],
      },
      {
        key: "this-year",
        label: "This Year",
        range: [startOfYear, endOfCurrentMonth],
      },
      {
        key: "last-year",
        label: "Last Year",
        range: [lastYearStart, lastYearEnd],
      },
      { key: "custom", label: "Custom" },
    ];
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setVisible(false);
        setCustomOpen(false);
      }
    };

    if (visible) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [visible]);

  useEffect(() => {
    if (selectedData) {
      setDates([
        selectedData[0] ? dayjs(selectedData[0]) : null,
        selectedData[1] ? dayjs(selectedData[1]) : null,
      ]);

      const matchingItem = menuItems.find((item) => {
        if (!item.range) return false;
        return (
          item.range[0].format("YYYY-MM-DD") === (selectedData[0] ? dayjs(selectedData[0]).format("YYYY-MM-DD") : null) &&
          item.range[1].format("YYYY-MM-DD") === (selectedData[1] ? dayjs(selectedData[1]).format("YYYY-MM-DD") : null)
        );
      });

      if (matchingItem) {
        setSelectedKey(matchingItem.key);
      } else if (selectedData[0] || selectedData[1]) {
        setSelectedKey("custom");
      }
    }
  }, [selectedData, menuItems]);

  const handleSetDates = (newDates: [Dayjs | null, Dayjs | null]) => {
    setDates(newDates);
    // Send the exact start-of-day instants (ISO) so the backend range matches
    // the viewer's local day regardless of server timezone.
    const stringDates: [string | null, string | null] = [
      newDates[0] ? newDates[0].startOf("day").toISOString() : null,
      newDates[1] ? newDates[1].startOf("day").toISOString() : null,
    ];
    onChange?.(stringDates);
  };

  const handleItemClick = (item: any) => {
    setSelectedKey(item.key);

    if (item.key === "custom") {
      setCustomOpen(true);
    } else if (item.range) {
      handleSetDates([item.range[0], item.range[1]]);
      setVisible(false);
      setCustomOpen(false);
    }
  };

  const formatDate = (date: Dayjs | null) => date?.format("YYYY-MM-DD") || "";

  // Open below by default; flip above when there isn't enough room (like antd Select).
  const toggleOpen = () => {
    const next = !visible;
    if (next && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const DROPDOWN_HEIGHT = 380;
      setDropUp(spaceBelow < DROPDOWN_HEIGHT && rect.top > spaceBelow);
    }
    setVisible(next);
  };
  return (
    <div
      ref={containerRef}
      className="relative inline-block w-full max-w-[220px]"
    >
      <div
        className={`relative w-full ${
          isDisabled ? "pointer-events-none opacity-50" : ""
        }`}
        onClick={toggleOpen}
      >
        <div className="flex items-center justify-between gap-2 px-3 py-[6px] border border-[#d8dbe1] rounded-[6px] bg-white cursor-pointer">
          <div className="flex items-center gap-2 truncate">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-[13px] text-[rgba(0,0,0,0.88)] truncate">
              {selectedKey === "custom" && dates[0] && dates[1]
                ? `${formatDate(dates[0])} to ${formatDate(dates[1])}`
                : selectedKey
                  ? menuItems.find((m) => m.key === selectedKey)?.label
                  : "Select Date"}
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${
              visible ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {visible && (
        /**
         * `data-lenis-prevent` because this panel is positioned inline, not
         * portalled to `document.body` the way Ant Design's own popups are —
         * so it sits inside the page's smooth-scroll container, and without
         * this the wheel over the preset list scrolls the page behind it
         * instead of the list under the pointer.
         */
        <div
          data-lenis-prevent
          className={`absolute z-[99999] right-0 min-w-[320px] max-h-[300px] overflow-auto overscroll-contain bg-white border border-gray-200 rounded-lg p-2 shadow-lg ${
            dropUp ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          {menuItems.map((item) => (
            <div key={item.key} className="mb-1 flex flex-col">
              <Button
                variant={selectedKey === item.key ? "primary" : "custom"}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  handleItemClick(item);
                }}
                className={`w-full justify-start border text-left !px-3 !py-1.5 !text-[13px] !border-gray-300 !rounded-[7px] ${
                  selectedKey !== item.key
                    ? "!text-gray-700 !bg-white hover:!bg-gray-50"
                    : ""
                }`}
              >
                {item.label}
              </Button>

              {item.key === "custom" && customOpen && (
                <div className="mt-2 px-3 py-2 border-t !border-gray-200 ">
                  <RangePicker
                    getPopupContainer={(trigger) =>
                      trigger.parentElement || document.body
                    }
                    autoFocus
                    open={true}
                    value={dates}
                    onChange={(range) => {
                      if (range && range[0] && range[1]) {
                        handleSetDates([range[0], range[1].add(1, "day")]);
                        setSelectedKey("custom");
                      }
                      setCustomOpen(false);
                      setVisible(false);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomDatePicker;
