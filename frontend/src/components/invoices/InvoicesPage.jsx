"use client";
import { useState, useEffect } from "react";
import { Receipt } from "lucide-react";
import InvoicesList from "./InvoicesList";
import InvoicesFilter from "./InvoicesFilter";
import InvoiceDetail from "./InvoiceDetail";
import InvoiceDeleteModal from "./InvoiceDeleteModal";
import { getAll, getById, remove } from "@/services/invoicesService";

const COLOR = "#A93226";

export default function InvoicesPage({ activeService, onServiceChange }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState({});
  const [isFiltered, setIsFiltered] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchInvoices = async (filters = activeFilters, q = search) => {
    setLoading(true);
    try {
      const result = await getAll({ search: q, ...filters });
      setInvoices(result.data);
      setIsFiltered(result.filtered);
    } catch {
      showToast("حدث خطأ أثناء تحميل البيانات", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices({}, ""); }, []);

  const handleSearch = (q) => {
    setSearch(q);
    fetchInvoices(activeFilters, q);
  };

  const handleFilterApply = (filters) => {
    setActiveFilters(filters);
    fetchInvoices(filters, search);
  };

  const handleFilterClear = () => {
    setActiveFilters({});
    fetchInvoices({}, search);
  };

  const handleView = async (invoice) => {
    try {
      const full = await getById(invoice.id);
      setSelectedInvoice(full);
    } catch {
      showToast("حدث خطأ أثناء تحميل تفاصيل الفاتورة", "error");
    }
  };

  const handleCreated = async (invoice) => {
    fetchInvoices();
    try {
      const full = await getById(invoice.id);
      setSelectedInvoice(full);
    } catch {
      // list already refreshed; the user can still open it from there
    }
  };

  const handleDeleteClick = (invoice) => setDeleteTarget(invoice);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await remove(deleteTarget.id);
    showToast("تم حذف الفاتورة بنجاح");
    setDeleteTarget(null);
    fetchInvoices();
  };

  if (selectedInvoice) {
    return (
      <div className="space-y-4">
        <InvoiceDetail invoice={selectedInvoice} onBack={() => setSelectedInvoice(null)} />

        {/* Toast */}
        {toast && (
          <div
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all duration-300 whitespace-nowrap ${
              toast.type === "error" ? "bg-red-500" : "bg-green-600"
            }`}
          >
            {toast.message}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: COLOR + "18" }}
          >
            <Receipt size={18} style={{ color: COLOR }} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">الفواتير</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-tight">
              {invoices.length > 0 ? `${invoices.length} فاتورة معروضة` : "إدارة الفواتير"}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Panel (always visible) */}
      <InvoicesFilter
        isFiltered={isFiltered}
        resultCount={invoices.length}
        onFilter={handleFilterApply}
        onClearFilter={handleFilterClear}
        onCreated={handleCreated}
        onToast={showToast}
      />

      {/* List */}
      <InvoicesList
        invoices={invoices}
        loading={loading}
        search={search}
        onSearch={handleSearch}
        isFiltered={isFiltered}
        onView={handleView}
        onDelete={handleDeleteClick}
        activeService={activeService}
      />

      {/* Delete Modal */}
      {deleteTarget && (
        <InvoiceDeleteModal
          invoice={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all duration-300 whitespace-nowrap ${
            toast.type === "error" ? "bg-red-500" : "bg-green-600"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
