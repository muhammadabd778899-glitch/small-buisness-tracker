import React, { useEffect, useState } from "react";
import { useBusinessStore } from "../store/business";
export const BillTrackerCalendar = () => {
  const { isDemo, businessData, bills, addBill, updateBill, removeBill } = useBusinessStore();
  const [form, setForm] = useState({
    name: "",
    category: "Operating",
    amount: 0,
    dueDate: /* @__PURE__ */ new Date(),
    frequency: "one-time",
    accountId: "",
    status: "pending",
    paidDate: null,
    notes: ""
  });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  useEffect(() => {
  }, [bills]);
  const handleShowForm = (id, bill) => {
    if (id && bill) {
      setForm({ ...bill });
      setEditingId(id);
    } else {
      setForm({
        name: "",
        category: "Operating",
        amount: 0,
        dueDate: /* @__PURE__ */ new Date(),
        frequency: "one-time",
        accountId: "",
        status: "pending",
        paidDate: null,
        notes: ""
      });
      setEditingId(null);
    }
    setShowForm(true);
  };
  const handleHideForm = () => {
    setShowForm(false);
    setForm({
      name: "",
      category: "Operating",
      amount: 0,
      dueDate: /* @__PURE__ */ new Date(),
      frequency: "one-time",
      accountId: "",
      status: "pending",
      paidDate: null,
      notes: ""
    });
    setEditingId(null);
  };
  const handleSave = async () => {
    try {
      const billData = {
        ...form,
        id: editingId || `bill-${Date.now()}`,
        name: form.name,
        category: form.category,
        amount: form.amount,
        dueDate: form.dueDate,
        frequency: form.frequency,
        accountId: form.accountId,
        status: form.status,
        paidDate: form.paidDate,
        notes: form.notes,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      };
      if (editingId) {
        await updateBill(editingId, {
          name: form.name,
          category: form.category,
          amount: form.amount,
          dueDate: form.dueDate,
          frequency: form.frequency,
          accountId: form.accountId,
          status: form.status,
          paidDate: form.paidDate,
          notes: form.notes
        });
      } else {
        await addBill(billData);
      }
      handleHideForm();
    } catch (error) {
      console.error("Failed to save bill:", error);
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "pt-8" }, /* @__PURE__ */ React.createElement("h2", { className: "text-2xl font-bold mb-6" }, "Bill Tracker and Calendar"), /* @__PURE__ */ React.createElement("div", { className: "bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] mb-8" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-medium text-[var(--muted)] mb-4" }, "Bills Overview"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-3 gap-3 mb-4" }, ["pending", "paid", "overdue"].map((status) => {
    const count = bills.filter((b) => b.status === status).length;
    if (count > 0) {
      const bgClass = status === "paid" ? "bg-[var(--success)]" : status === "overdue" ? "bg-[var(--danger)]" : "bg-[var(--warning)]";
      const textClass = status === "paid" ? "text-[var(--success)]" : status === "overdue" ? "text-[var(--danger)]" : "text-[var(--warning)]";
      const el = document.getElementById(`bill-${status}`);
      if (el) {
        el.innerHTML = `
                  <div id="bill-${status}" className="p-2 rounded">
                    <span className="${textClass} font-medium">${status}: ${count}</span>
                  </div>
                `;
      }
    }
    return null;
  }))), showForm && /* @__PURE__ */ React.createElement("div", { className: "bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] max-w-md" }, /* @__PURE__ */ React.createElement("h3", { className: editingId ? "text-sm font-medium text-[var(--dark)] mb-3" : "text-sm font-medium text-[var(--muted)] mb-3" }, editingId ? "Edit Bill" : "Add New Bill"), /* @__PURE__ */ React.createElement("form", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm text-[var(--muted)] mb-1" }, "Bill Name"), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: form.name || "",
      onChange: (e) => setForm({ ...form, name: e.target.value }),
      className: "w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-2" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm text-[var(--muted)] mb-1" }, "Amount"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      step: "0.01",
      value: form.amount || 0,
      onChange: (e) => setForm({ ...form, amount: Number(e.target.value) }),
      className: "w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm text-[var(--muted)] mb-1" }, "Due Date"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "date",
      value: form.dueDate ? new Date(form.dueDate).toISOString().split("T")[0] : "",
      onChange: (e) => setForm({ ...form, dueDate: e.target.value ? new Date(e.target.value) : /* @__PURE__ */ new Date() }),
      className: "w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
    }
  ))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm text-[var(--muted)] mb-1" }, "Category"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: form.category || "Operating",
      onChange: (e) => setForm({ ...form, category: e.target.value }),
      className: "w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
    },
    /* @__PURE__ */ React.createElement("option", { value: "Operating" }, "Operating"),
    /* @__PURE__ */ React.createElement("option", { value: "Rent" }, "Rent"),
    /* @__PURE__ */ React.createElement("option", { value: "Utilities" }, "Utilities"),
    /* @__PURE__ */ React.createElement("option", { value: "Marketing" }, "Marketing"),
    /* @__PURE__ */ React.createElement("option", { value: "Equipment" }, "Equipment"),
    /* @__PURE__ */ React.createElement("option", { value: "Materials" }, "Materials"),
    /* @__PURE__ */ React.createElement("option", { value: "Loan" }, "Loan")
  )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-2" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm text-[var(--muted)] mb-1" }, "Frequency"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: form.frequency || "one-time",
      onChange: (e) => setForm({ ...form, frequency: e.target.value }),
      className: "w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
    },
    /* @__PURE__ */ React.createElement("option", { value: "one-time" }, "One-Time"),
    /* @__PURE__ */ React.createElement("option", { value: "weekly" }, "Weekly"),
    /* @__PURE__ */ React.createElement("option", { value: "monthly" }, "Monthly"),
    /* @__PURE__ */ React.createElement("option", { value: "quarterly" }, "Quarterly"),
    /* @__PURE__ */ React.createElement("option", { value: "yearly" }, "Yearly")
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm text-[var(--muted)] mb-1" }, "Account"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: form.accountId || "",
      onChange: (e) => setForm({ ...form, accountId: e.target.value }),
      className: "w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
    },
    /* @__PURE__ */ React.createElement("option", { value: "" }, "Select Account")
  ))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm text-[var(--muted)] mb-1" }, "Status"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: form.status || "pending",
      onChange: (e) => setForm({ ...form, status: e.target.value }),
      className: "w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
    },
    /* @__PURE__ */ React.createElement("option", { value: "pending" }, "Pending"),
    /* @__PURE__ */ React.createElement("option", { value: "paid" }, "Paid"),
    /* @__PURE__ */ React.createElement("option", { value: "overdue" }, "Overdue")
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm text-[var(--muted)] mb-1" }, "Paid Date"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "date",
      value: form.paidDate ? new Date(form.paidDate).toISOString().split("T")[0] : "",
      onChange: (e) => setForm({ ...form, paidDate: e.target.value ? new Date(e.target.value) : null }),
      className: "w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm text-[var(--muted)] mb-1" }, "Notes"), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      value: form.notes || "",
      onChange: (e) => setForm({ ...form, notes: e.target.value }),
      className: "w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)] h-24 resize-none",
      rows: 3
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "mt-6 flex justify-end gap-3" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: handleHideForm,
      className: "px-4 py-2 rounded text-sm text-[var(--fg)] hover:bg-[var(--soft-bg)] transition-colors"
    },
    "Cancel"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: handleSave,
      className: "px-4 py-2 rounded bg-[var(--accent)] text-white text-sm hover:bg-[var(--deeporange)] transition-colors"
    },
    editingId ? "Update" : "Add Bill"
  )))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8" }, /* @__PURE__ */ React.createElement("div", { className: "bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-[var(--muted)]" }, "Pending"), /* @__PURE__ */ React.createElement("p", { className: "text-2xl font-bold text-[var(--warning)]" }, bills.filter((b) => b.status === "pending").length)), /* @__PURE__ */ React.createElement("div", { className: "bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-[var(--muted)]" }, "Paid"), /* @__PURE__ */ React.createElement("p", { className: "text-2xl font-bold text-[var(--success)]" }, bills.filter((b) => b.status === "paid").length)), /* @__PURE__ */ React.createElement("div", { className: "bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-[var(--muted)]" }, "Overdue"), /* @__PURE__ */ React.createElement("p", { className: "text-2xl font-bold text-[var(--danger)]" }, bills.filter((b) => b.status === "overdue").length)), /* @__PURE__ */ React.createElement("div", { className: "bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-[var(--muted)]" }, "Total"), /* @__PURE__ */ React.createElement("p", { className: "text-2xl font-bold" }, bills.reduce((sum, b) => sum + (b.amount || 0), 0).toLocaleString()))));
};
