import React, { useState } from "react";
import { useBusinessStore } from "../store/business";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie
} from "recharts";
export const Reports = () => {
  const navigate = useNavigate();
  const { isDemo, businessData, incomeTransactions, expenseTransactions, products, clients, orders, invoices, payments, goals, budgets } = useBusinessStore();
  const { isLoaded } = useBusinessStore();
  const [period, setPeriod] = useState("this-month");
  const [customStart, setCustomStart] = useState(null);
  const [customEnd, setCustomEnd] = useState(null);
  const today = /* @__PURE__ */ new Date();
  const getDateRange = () => {
    const start = /* @__PURE__ */ new Date();
    const end = new Date(today);
    switch (period) {
      case "this-month":
        start.setDate(1);
        break;
      case "last-month":
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        return { start: lastMonth, end: lastMonthEnd };
      case "this-quarter":
        const quarterMonth = Math.floor(today.getMonth() / 3) * 3;
        start.setMonth(quarterMonth, 1);
        break;
      case "this-year":
        start.setFullYear(today.getFullYear(), 0, 1);
        break;
      case "last-year":
        start.setFullYear(today.getFullYear() - 1, 0, 1);
        end.setFullYear(today.getFullYear() - 1, 11, 31);
        break;
      case "last-12-months":
        start.setMonth(today.getMonth() - 11);
        break;
      case "custom":
        if (customStart && customEnd) {
          return { start: customStart, end: customEnd };
        }
        return { start: /* @__PURE__ */ new Date(0), end: today };
      default:
        start.setDate(1);
    }
    return { start, end };
  };
  const { startDate, endDate } = getDateRange();
  const filteredIncome = incomeTransactions.filter((t) => {
    const txDate = new Date(t.date);
    return txDate >= startDate && txDate <= endDate;
  });
  const filteredExpenses = expenseTransactions.filter((t) => {
    const txDate = new Date(t.date);
    return txDate >= startDate && txDate <= endDate;
  });
  const periodRevenue = filteredIncome.reduce((sum, t) => sum + t.amount, 0);
  const periodExpenses = filteredExpenses.reduce((sum, t) => sum + t.amount, 0);
  const periodNetProfit = periodRevenue - periodExpenses;
  const periodProfitMargin = periodRevenue > 0 ? periodNetProfit / periodRevenue * 100 : 0;
  const revenueOverTime = [];
  const expensesOverTime = [];
  const incomeByCategory = [];
  const expensesByCategory = [];
  const salesByProduct = [];
  return /* @__PURE__ */ React.createElement("div", { className: "pt-8" }, /* @__PURE__ */ React.createElement("h2", { className: "text-2xl font-bold mb-6" }, "Report Center"), /* @__PURE__ */ React.createElement("div", { className: "bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] mb-8" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-medium text-[var(--muted)] mb-4" }, "Report Period"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-6 gap-2" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setPeriod("this-month"),
      className: `px-4 py-2 rounded text-sm font-medium ${period === "this-month" ? "bg-[var(--accent)] text-white" : "text-[var(--fg)] hover:bg-[var(--soft-bg)]"}`
    },
    "This Month"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setPeriod("last-month"),
      className: `px-4 py-2 rounded text-sm font-medium ${period === "last-month" ? "bg-[var(--accent)] text-white" : "text-[var(--fg)] hover:bg-[var(--soft-bg)]"}`
    },
    "Last Month"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setPeriod("this-quarter"),
      className: `px-4 py-2 rounded text-sm font-medium ${period === "this-quarter" ? "bg-[var(--accent)] text-white" : "text-[var(--fg)] hover:bg-[var(--soft-bg)]"}`
    },
    "This Quarter"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setPeriod("this-year"),
      className: `px-4 py-2 rounded text-sm font-medium ${period === "this-year" ? "bg-[var(--accent)] text-white" : "text-[var(--fg)] hover:bg-[var(--soft-bg)]"}`
    },
    "This Year"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setPeriod("last-year"),
      className: `px-4 py-2 rounded text-sm font-medium ${period === "last-year" ? "bg-[var(--accent)] text-white" : "text-[var(--fg)] hover:bg-[var(--soft-bg)]"}`
    },
    "Last Year"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setPeriod("last-12-months"),
      className: `px-4 py-2 rounded text-sm font-medium ${period === "last-12-months" ? "bg-[var(--accent)] text-white" : "text-[var(--fg)] hover:bg-[var(--soft-bg)]"}`
    },
    "Last 12 Months"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setPeriod("custom"),
      className: `px-4 py-2 rounded text-sm font-medium ${period === "custom" ? "bg-[var(--accent)] text-white" : "text-[var(--fg)] hover:bg-[var(--soft-bg)]"}`
    },
    "Custom Range"
  )), period === "custom" && customStart && customEnd && /* @__PURE__ */ React.createElement("div", { className: "mt-4 grid grid-cols-2 gap-2" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "date",
      value: customStart.toLocaleDateString(),
      onChange: (e) => setCustomStart(new Date(e.target.value)),
      className: "border rounded p-1 text-sm"
    }
  ), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "date",
      value: customEnd.toLocaleDateString(),
      onChange: (e) => setCustomEnd(new Date(e.target.value)),
      className: "border rounded p-1 text-sm"
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setPeriod("this-month"),
      className: "mt-2 col-span-2 px-4 py-2 rounded text-sm text-[var(--accent)] hover:bg-[var(--soft-bg)]"
    },
    "Cancel"
  ))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4 mb-8" }, /* @__PURE__ */ React.createElement("div", { className: "bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-medium text-[var(--muted)] mb-2" }, "Revenue"), /* @__PURE__ */ React.createElement("p", { className: "text-2xl font-bold" }, periodRevenue.toLocaleString(void 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 }))), /* @__PURE__ */ React.createElement("div", { className: "bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-medium text-[var(--muted)] mb-2" }, "Expenses"), /* @__PURE__ */ React.createElement("p", { className: "text-2xl font-bold text-[var(--danger)]" }, periodExpenses.toLocaleString(void 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 }))), /* @__PURE__ */ React.createElement("div", { className: "bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-medium text-[var(--muted)] mb-2" }, "Net Profit"), /* @__PURE__ */ React.createElement("p", { className: "text-2xl font-bold {periodNetProfit >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}" }, periodNetProfit >= 0 ? "+" : "", periodNetProfit.toLocaleString(void 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 }))), /* @__PURE__ */ React.createElement("div", { className: "bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-medium text-[var(--muted)] mb-2" }, "Profit Margin"), /* @__PURE__ */ React.createElement("p", { className: "text-2xl font-bold" }, periodProfitMargin.toFixed(1), "%"))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-medium text-[var(--muted)] mb-4" }, "Revenue vs Expenses Trend"), /* @__PURE__ */ React.createElement(ResponsiveContainer, { width: "100%", height: 300 }, /* @__PURE__ */ React.createElement(BarChart, { data: [], margin: { top: 20, right: 30, left: 0, bottom: 0 } }, /* @__PURE__ */ React.createElement(XAxis, { dataKey: "name", stroke: "#848484" }), /* @__PURE__ */ React.createElement(YAxis, { stroke: "#848484" }), /* @__PURE__ */ React.createElement(Tooltip, null), /* @__PURE__ */ React.createElement(Legend, null), /* @__PURE__ */ React.createElement(Bar, { dataKey: "revenue", name: "Revenue", fill: "var(--accent)" }), /* @__PURE__ */ React.createElement(Bar, { dataKey: "expenses", name: "Expenses", fill: "var(--danger)" })))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-medium text-[var(--muted)] mb-4" }, "Monthly Profit Trend"), /* @__PURE__ */ React.createElement(ResponsiveContainer, { width: "100%", height: 300 }, /* @__PURE__ */ React.createElement(LineChart, { data: [], margin: { top: 20, right: 30, left: 0, bottom: 0 } }, /* @__PURE__ */ React.createElement(XAxis, { dataKey: "month", stroke: "#848484" }), /* @__PURE__ */ React.createElement(YAxis, { stroke: "#848484" }), /* @__PURE__ */ React.createElement(Tooltip, null), /* @__PURE__ */ React.createElement(Legend, null, /* @__PURE__ */ React.createElement(LegendItem, { cursor: "#848484" })), /* @__PURE__ */ React.createElement(Area, { dataKey: "profit", fill: "var(--accent)" }), /* @__PURE__ */ React.createElement(Line, { dataKey: "profit", stroke: "var(--accent)", strokeWidth: 2 })))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-medium text-[var(--muted)] mb-4" }, "Income by Category"), /* @__PURE__ */ React.createElement(ResponsiveContainer, { width: "100%", height: 250 }, /* @__PURE__ */ React.createElement(PieChart, { data: [], margin: { top: 20, right: 30, left: 0, bottom: 0 } }, /* @__PURE__ */ React.createElement(Pie, { dataKey: "label", fill: "#848484" }), /* @__PURE__ */ React.createElement(Pie, { dataKey: "value", stroke: "#ffffff", strokeWidth: 2 })))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-medium text-[var(--muted)] mb-4" }, "Expenses by Category"), /* @__PURE__ */ React.createElement(ResponsiveContainer, { width: "100%", height: 250 }, /* @__PURE__ */ React.createElement(PieChart, { data: [], margin: { top: 20, right: 30, left: 0, bottom: 0 } }, /* @__PURE__ */ React.createElement(Pie, { dataKey: "label", fill: "#848484" }), /* @__PURE__ */ React.createElement(Pie, { dataKey: "value", stroke: "#ffffff", strokeWidth: 2 }))))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8" }, /* @__PURE__ */ React.createElement("div", { className: "bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-medium text-[var(--muted)] mb-4" }, "Monthly Financial Report"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-[var(--muted)]" }, "Comprehensive monthly report with revenue, expenses, profit margins and key performance indicators."), /* @__PURE__ */ React.createElement("div", { className: "mt-4" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline text-sm hover:text-[var(--accent)] transition-colors" }, "Generate Report"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline text-sm ml-2 hover:text-[var(--accent)] transition-colors" }, "Export CSV"))), /* @__PURE__ */ React.createElement("div", { className: "bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-medium text-[var(--muted)] mb-4" }, "Quarterly Report"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-[var(--muted)]" }, "Quarterly overview with trend analysis and comparison to previous quarters."), /* @__PURE__ */ React.createElement("div", { className: "mt-4" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline text-sm hover:text-[var(--accent)] transition-colors" }, "Generate Report"))), /* @__PURE__ */ React.createElement("div", { className: "bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-medium text-[var(--muted)] mb-4" }, "Annual Report"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-[var(--muted)]" }, "Full year overview with annual summaries, trend analysis and future projections."), /* @__PURE__ */ React.createElement("div", { className: "mt-4" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline text-sm hover-text-[var(--accent)] transition-colors" }, "Generate Report")))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6" }, /* @__PURE__ */ React.createElement("div", { className: "bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-medium text-[var(--muted)] mb-4" }, "Category Report"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-[var(--muted)]" }, "Breakdown of income and expenses by category with comparative analysis.")), /* @__PURE__ */ React.createElement("div", { className: "bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-medium text-[var(--muted)] mb-4" }, "Account Balance Report"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-[var(--muted)]" }, "Current balances across all business accounts with transaction history.")), /* @__PURE__ */ React.createElement("div", { className: "bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-medium text-[var(--muted)] mb-4" }, "Tax Report"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-[var(--muted)]" }, "Tax collected, tax paid, and taxable income/expenses summary with disclaimers.")), /* @__PURE__ */ React.createElement("div", { className: "bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-medium text-[var(--muted)] mb-4" }, "Product Performance Report"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-[var(--muted)]" }, "Profitability analysis, sales trends and inventory turnover by product.")), /* @__PURE__ */ React.createElement("div", { className: "bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-medium text-[var(--muted)] mb-4" }, "Inventory Report"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-[var(--muted)]" }, "Current stock levels, movements, valuation and reorder analysis.")), /* @__PURE__ */ React.createElement("div", { className: "bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-medium text-[var(--muted)] mb-4" }, "Client Report"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-[var(--muted)]" }, "Client lifetime value, order history and outstanding balances.")), /* @__PURE__ */ React.createElement("div", { className: "bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-medium text-[var(--muted)] mb-4" }, "Invoice Report"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-[var(--muted)]" }, "Invoice status, payment status and aging analysis.")), /* @__PURE__ */ React.createElement("div", { className: "bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-medium text-[var(--muted)] mb-4" }, "Custom Metrics Report"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-[var(--muted)]" }, "Define custom KPIs and metrics for specific business needs."))), /* @__PURE__ */ React.createElement("div", { className: "mt-8 bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-medium text-[var(--muted)] mb-4" }, "CSV Export"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-[var(--muted)]" }, "Export any report data to CSV format for external analysis or backup."), /* @__PURE__ */ React.createElement("div", { className: "mt-4" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline text-sm hover-text-[var(--accent)] transition-colors" }, "Export Selected Data"))));
};
