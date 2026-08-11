import { Skeleton } from "antd";
import React from "react";

export const FieldSkeleton = () => (
  <div className="min-w-0">
    <Skeleton.Input active size="small" className="!w-20 !h-3 mb-1.5 !block" />
    <Skeleton.Input active size="small" className="!w-32 !h-4 !block" />
  </div>
);

export const FieldGridSkeleton = ({ cols = 3 }: { cols?: 2 | 3 | 4 }) => (
  <div
    className={`grid gap-x-6 gap-y-5 ${
      cols === 2
        ? "sm:grid-cols-2"
        : cols === 4
        ? "sm:grid-cols-2 lg:grid-cols-4"
        : "sm:grid-cols-2 lg:grid-cols-3"
    }`}
  >
    <FieldSkeleton />
    <FieldSkeleton />
    <FieldSkeleton />
    <FieldSkeleton />
    <FieldSkeleton />
    <FieldSkeleton />
  </div>
);

export const PanelSkeleton = ({
  hasHeader = true,
  children,
  className,
}: {
  hasHeader?: boolean;
  children?: React.ReactNode;
  className?: string;
}) => (
  <section
    className={`overflow-hidden rounded-xl border border-secondary-100 bg-white shadow-[0_1px_2px_rgba(16,24,40,.04)] ${
      className || ""
    }`}
  >
    {hasHeader && (
      <header className="flex items-center gap-3 border-b border-secondary-100/80 px-5 py-3.5">
        <Skeleton.Avatar active shape="square" size={36} className="!rounded-lg" />
        <div>
          <Skeleton.Input active size="small" className="!w-24 !h-4 mb-1 !block" />
          <Skeleton.Input active size="small" className="!w-32 !h-3 !block" />
        </div>
      </header>
    )}
    <div className="p-5">{children || <FieldGridSkeleton />}</div>
  </section>
);

export const StatSkeleton = () => (
  <div className="rounded-xl border border-secondary-100 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,.04)]">
    <div className="flex items-start gap-3">
      <Skeleton.Avatar active shape="square" size={36} className="!rounded-lg" />
      <div>
        <Skeleton.Input active size="small" className="!w-16 !h-3 mb-1 !block" />
        <Skeleton.Input active size="small" className="!w-24 !h-6 !block" />
      </div>
    </div>
  </div>
);

export const StatRowSkeleton = () => (
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    <StatSkeleton />
    <StatSkeleton />
    <StatSkeleton />
    <StatSkeleton />
  </div>
);

export const HeroSkeleton = ({ hasAvatar = false }: { hasAvatar?: boolean }) => (
  <div className="relative mb-4 overflow-hidden rounded-xl border border-secondary-100 bg-white">
    <div className="absolute inset-x-0 top-0 h-24 bg-secondary-100" />
    <div className="relative px-5 pb-5 pt-6">
      <div className="flex flex-wrap items-end gap-4">
        {hasAvatar && (
          <div className="shrink-0">
            <Skeleton.Avatar
              active
              shape="square"
              className="!w-20 !h-20 !rounded-xl border-4 border-white shadow-md bg-secondary-200"
            />
          </div>
        )}
        <div className="min-w-0 flex-1 pb-1 space-y-2">
          <Skeleton.Input active size="small" className="!w-48 !h-6 !block" />
          <Skeleton.Input active size="small" className="!w-64 !h-4 !block" />
          <div className="mt-2 flex gap-2">
            <Skeleton.Button active size="small" className="!w-16 !h-5 !rounded-full" />
            <Skeleton.Button active size="small" className="!w-20 !h-5 !rounded-full" />
            <Skeleton.Button active size="small" className="!w-24 !h-5 !rounded-full" />
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-px overflow-hidden rounded-lg border border-secondary-100 bg-secondary-100 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white px-4 py-3">
            <Skeleton.Input active size="small" className="!w-16 !h-3 mb-1.5 !block" />
            <Skeleton.Input active size="small" className="!w-20 !h-5 !block" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const TabBarSkeleton = () => (
  <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-secondary-100 bg-white p-1">
    {Array.from({ length: 4 }).map((_, i) => (
      <Skeleton.Button
        key={i}
        active
        size="small"
        className="!w-28 !h-9 !rounded-lg"
      />
    ))}
  </div>
);
