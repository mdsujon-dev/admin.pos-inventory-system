import { Table } from "antd";
import { Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import "./DataTable.css";

export default function DataTable(props: any) {
  const {
    data,
    columns,
    rowKey,
    currentPage,
    setLimit,
    setCurrentPage,
    selectRow = false,
    isPaginate,
    showHeader,
    total,
    limit,
    loading = false,
    isFetching = false,
    onSelectRowsChange,
    isShowSizeChanger = false,
    selectedRowKeys: controlledSelectedKeys,
    setSelectedRowKeys: setControlledSelectedKeys,
    onTableChange,
    expandable,
    onRow,
    /**
     * What an empty result says. Left off, AntD's "No Data" stands — which is
     * accurate and useless: a list can be empty because nothing exists yet or
     * because a filter excluded everything, and only the screen knows which.
     */
    emptyText,
  } = props;

  const showLoader = loading || isFetching;
  const [internalSelectedKeys, setInternalSelectedKeys] = useState<any[]>([]);
  const tableRef = useRef<HTMLDivElement>(null);

  const isControlled =
    controlledSelectedKeys !== undefined &&
    typeof setControlledSelectedKeys === "function";
  const selectedRowKeys = isControlled
    ? controlledSelectedKeys
    : internalSelectedKeys;

  // Handle drag to scroll
  useEffect(() => {
    const tableEl = tableRef.current;
    if (!tableEl) return;

    // Ant Design's scroll container
    const scrollContainer =
      tableEl.querySelector(".ant-table-content") ||
      tableEl.querySelector(".ant-table-body");

    if (!scrollContainer) return;

    let isDown = false;
    let startX: number;
    let scrollLeft: number;

    /**
     * A drag only counts once the pointer has actually moved.
     *
     * `is-dragging` switches the table to `pointer-events: none`, and it used to
     * go on at mousedown — so pressing the mouse anywhere in the table killed
     * the element under the cursor before the click could land on it. Every
     * row's ⋮ menu, and any button inside a cell, silently did nothing.
     *
     * Five pixels of movement is the difference between "clicking" and
     * "dragging", so that is where the class goes on now.
     */
    const DRAG_THRESHOLD = 5;
    let dragging = false;

    const onMouseDown = (e: MouseEvent) => {
      // Left button only — a right-click is a context menu, not a drag.
      if (e.button !== 0) return;
      isDown = true;
      dragging = false;
      startX = e.pageX - (scrollContainer as HTMLElement).offsetLeft;
      scrollLeft = scrollContainer.scrollLeft;
    };

    const stop = () => {
      isDown = false;
      dragging = false;
      scrollContainer.classList.remove("is-dragging");
    };

    const onMouseLeave = stop;
    const onMouseUp = stop;

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      const x = e.pageX - (scrollContainer as HTMLElement).offsetLeft;
      const walk = (x - startX) * 1.5; // Drag speed multiplier

      if (!dragging) {
        if (Math.abs(walk) < DRAG_THRESHOLD) return;
        dragging = true;
        scrollContainer.classList.add("is-dragging");
      }

      e.preventDefault();
      scrollContainer.scrollLeft = scrollLeft - walk;
    };

    scrollContainer.addEventListener("mousedown", onMouseDown as EventListener);
    scrollContainer.addEventListener("mouseleave", onMouseLeave);
    scrollContainer.addEventListener("mouseup", onMouseUp);
    scrollContainer.addEventListener("mousemove", onMouseMove as EventListener);

    return () => {
      scrollContainer.removeEventListener(
        "mousedown",
        onMouseDown as EventListener,
      );
      scrollContainer.removeEventListener("mouseleave", onMouseLeave);
      scrollContainer.removeEventListener("mouseup", onMouseUp);
      scrollContainer.removeEventListener(
        "mousemove",
        onMouseMove as EventListener,
      );
    };
  }, [loading, isFetching, data]); // Re-bind if DOM updates

  // Handle row selection change
  const handleRowSelectionChange = (nextKeys: any, selectedRows: any) => {
    if (isControlled) {
      setControlledSelectedKeys(nextKeys);
    } else {
      setInternalSelectedKeys(nextKeys);
    }
    if (onSelectRowsChange) {
      onSelectRowsChange(selectedRows);
    }
  };

  // rowSelection object for row selection features
  const rowSelection = {
    selectedRowKeys,
    onChange: handleRowSelectionChange,
    getCheckboxProps: (record: any) => {
      return { disabled: record.name === "Disabled User", name: record.name };
    },
  };

  return (
    <div ref={tableRef}>
      <Table
        loading={{
          spinning: showLoader,
          indicator: (
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          ),
        }}
        className="pos-table rounded-lg overflow-hidden border border-primary/30 bg-white/40 backdrop-blur-md"
        rowKey={rowKey ? rowKey : "_id"}
        rowSelection={selectRow ? rowSelection : undefined}
        dataSource={data || []}
        columns={columns}
        expandable={expandable}
        locale={emptyText ? { emptyText } : undefined}
        scroll={{ x: true }}
        pagination={
          isPaginate
            ? {
                pageSize: limit || 20,
                // Nothing to page through on a single page, so the whole footer
                // stays out of the way until there is a second one.
                hideOnSinglePage: true,
                showTotal: (t: number, range: [number, number]) => (
                  <span className="text-xs text-secondary-500">
                    {range[0]}–{range[1]} of {t}
                  </span>
                ),
                total: total || data?.count || data?.length || 0,
                current: currentPage,
                // onChange: handlePageChange,
                onChange: (page) => {
                  // handlePageChange(page);
                  setCurrentPage(page);
                },
                showSizeChanger: isShowSizeChanger,
                pageSizeOptions: ["10", "25", "50", "100"],
                onShowSizeChange: (_current, newSize) => {
                  setLimit(newSize);
                  setCurrentPage(1);
                },
                showQuickJumper: true,
              }
            : false
        }
        showHeader={showHeader}
        onChange={onTableChange}
        onRow={onRow}
      />
    </div>
  );
}
