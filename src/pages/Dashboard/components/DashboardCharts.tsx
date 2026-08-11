import React from "react";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

// 1. Sales Trend (Area Chart)
export const SalesTrendChart = () => {
  const options: ApexOptions = {
    chart: { type: "area", toolbar: { show: false }, zoom: { enabled: false } },
    colors: ["#3b82f6", "#8b5cf6"],
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 3 },
    fill: {
      type: "gradient",
      gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 90, 100] },
    },
    xaxis: { categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"] },
    legend: { position: "top" },
    title: { text: "Sales & Orders Trend", style: { fontWeight: "bold" } },
  };

  const series = [
    { name: "Sales (৳)", data: [31000, 40000, 28000, 51000, 42000, 60000, 56000] },
    { name: "Orders", data: [110, 150, 95, 200, 170, 250, 220] },
  ];

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-secondary-100">
      <ReactApexChart options={options} series={series} type="area" height={300} />
    </div>
  );
};

// 2. Top Selling Categories (Bar Chart)
export const CategorySalesChart = () => {
  const options: ApexOptions = {
    chart: { type: "bar", toolbar: { show: false } },
    colors: ["#10b981", "#f59e0b", "#f43f5e", "#06b6d4", "#8b5cf6"],
    plotOptions: { bar: { borderRadius: 4, horizontal: true, distributed: true } },
    dataLabels: { enabled: true, textAnchor: "start", offsetX: 0 },
    xaxis: { categories: ["Electronics", "Clothing", "Groceries", "Furniture", "Toys"] },
    legend: { show: false },
    title: { text: "Top Selling Categories", style: { fontWeight: "bold" } },
  };

  const series = [{ name: "Units Sold", data: [400, 330, 248, 150, 90] }];

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-secondary-100">
      <ReactApexChart options={options} series={series} type="bar" height={300} />
    </div>
  );
};

// 3. Revenue Split (Donut Chart)
export const RevenueSplitChart = () => {
  const options: ApexOptions = {
    chart: { type: "donut" },
    colors: ["#019532", "#3b82f6", "#e91e63", "#f59e0b"],
    labels: ["Online Store", "Physical POS", "Wholesale", "Affiliates"],
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            name: { show: true },
            value: { show: true, formatter: (val) => `৳ ${val}` },
            total: { show: true, showAlways: true, label: "Total", color: "#373d3f" },
          },
        },
      },
    },
    title: { text: "Revenue By Source", style: { fontWeight: "bold" } },
    legend: { position: "bottom" },
  };

  const series = [450000, 230000, 110000, 50000];

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-secondary-100">
      <ReactApexChart options={options} series={series} type="donut" height={300} />
    </div>
  );
};

// 4. Target Achievement (Radial Bar Chart)
export const TargetAchievementChart = () => {
  const options: ApexOptions = {
    chart: { type: "radialBar" },
    colors: ["#019532", "#06b6d4", "#f43f5e"],
    plotOptions: {
      radialBar: {
        dataLabels: {
          name: { fontSize: "16px" },
          value: { fontSize: "24px", fontWeight: "bold", formatter: (val) => `${val}%` },
          total: { show: true, label: "Overall", formatter: () => "80%" },
        },
        track: { background: "#f1f5f9", strokeWidth: "100%", margin: 5 },
      },
    },
    labels: ["Sales", "New Customers", "Retention"],
    title: { text: "Monthly Targets", style: { fontWeight: "bold" } },
  };

  const series = [85, 60, 95];

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-secondary-100">
      <ReactApexChart options={options} series={series} type="radialBar" height={300} />
    </div>
  );
};

// 5. Customer Metrics (Radar Chart)
export const CustomerMetricsChart = () => {
  const options: ApexOptions = {
    chart: { type: "radar", toolbar: { show: false } },
    colors: ["#ec4899", "#8b5cf6"],
    xaxis: {
      categories: ["Quality", "Price", "Service", "Delivery", "Support", "UI/UX"],
    },
    stroke: { width: 2, dashArray: 0 },
    fill: { opacity: 0.2 },
    markers: { size: 4, hover: { size: 7 } },
    title: { text: "Customer Metrics", style: { fontWeight: "bold" } },
    legend: { position: "bottom" },
  };

  const series = [
    { name: "Current Month", data: [90, 75, 85, 95, 80, 90] },
    { name: "Last Month", data: [80, 70, 75, 85, 75, 80] },
  ];

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-secondary-100">
      <ReactApexChart options={options} series={series} type="radar" height={300} />
    </div>
  );
};

// 6. Weekly Activity (Heatmap Chart)
export const WeeklyActivityChart = () => {
  const options: ApexOptions = {
    chart: { type: "heatmap", toolbar: { show: false } },
    dataLabels: { enabled: false },
    colors: ["#019532"],
    title: { text: "Order Activity Heatmap", style: { fontWeight: "bold" } },
    xaxis: { categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
    plotOptions: {
      heatmap: {
        radius: 4,
        enableShades: true,
        shadeIntensity: 0.5,
        colorScale: {
          ranges: [
            { from: 0, to: 10, color: "#e2e8f0", name: "Low" },
            { from: 11, to: 30, color: "#6ee7b7", name: "Medium" },
            { from: 31, to: 100, color: "#059669", name: "High" },
          ],
        },
      },
    },
  };

  const generateData = () => {
    return Array.from({ length: 7 }, () => Math.floor(Math.random() * 50));
  };

  const series = [
    { name: "Morning", data: generateData() },
    { name: "Afternoon", data: generateData() },
    { name: "Evening", data: generateData() },
    { name: "Night", data: generateData() },
  ];

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-secondary-100">
      <ReactApexChart options={options} series={series} type="heatmap" height={300} />
    </div>
  );
};

// Wrapper Component to Render All 6 Charts
export const StaticChartsSection = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
      <SalesTrendChart />
      <RevenueSplitChart />
      <TargetAchievementChart />
      <CategorySalesChart />
      <CustomerMetricsChart />
      <WeeklyActivityChart />
    </div>
  );
};
