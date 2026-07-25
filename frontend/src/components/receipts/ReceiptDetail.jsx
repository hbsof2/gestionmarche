"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { ArrowRight, Plus, Trash2, Pencil, Check, X, FileText, Search, ChevronDown, Package, Lightbulb } from "lucide-react";
import {
  getReceiptItems,
  getAvailableMaterials,
  addReceiptItem,
  updateReceiptItem,
  removeReceiptItem,
} from "@/services/receiptsService";
import ReceiptItemDeleteModal from "./ReceiptItemDeleteModal";
import ReceiptItemEditModal from "./ReceiptItemEditModal";

const COLOR = "#2471A3";

function formatDate(isoDate) {
  if (!isoDate) return "-";
  const [year, month, day] = isoDate.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function formatAmount(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "-";
  return `${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} دج`;
}

function formatTva(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "-";
  return `${n} %`;
}

function formatQuantity(value, unit) {
  const n = Number(value);
  if (Number.isNaN(n)) return "-";
  return `${n.toLocaleString("en-US", { maximumFractionDigits: 3 })} ${unit || ""}`.trim();
}

function MaterialSearchableSelect({ value, options, onChange, error }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find((o) => String(o.deal_item_id) === String(value));

  const getLabel = (m) => `${m.name_ar}${m.name_lat ? " - " + m.name_lat : ""}`;

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => getLabel(o).toLowerCase().includes(q));
  }, [query, options]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors flex items-center justify-between gap-2 ${
          error
            ? "border-red-300 bg-red-50 dark:bg-red-500/10 dark:border-red-500/30"
            : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700"
        }`}
      >
        <span className={selected ? "text-slate-800 dark:text-slate-100 truncate" : "text-slate-400 dark:text-slate-500 truncate"}>
          {selected ? getLabel(selected) : "-- اختر مادة أولية --"}
        </span>
        <ChevronDown size={16} className="text-slate-400 dark:text-slate-500 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 dark:border-slate-700">
            <Search size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="اكتب للبحث..."
              className="bg-transparent text-sm w-full outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-slate-400 dark:text-slate-500 text-center">لا توجد نتائج</p>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.deal_item_id}
                  type="button"
                  onClick={() => {
                    onChange(o.deal_item_id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`w-full text-right px-3 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-50 dark:border-slate-700/50 last:border-b-0 ${
                    String(o.deal_item_id) === String(value) ? "bg-slate-50 dark:bg-slate-700" : ""
                  }`}
                >
                  <p className="font-medium text-slate-800 dark:text-slate-100">{getLabel(o)}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-slate-400 dark:text-slate-500">
                    <span>الوحدة: {o.unit}</span>
                    <span>المتبقي: {formatQuantity(o.remaining_qty, o.unit)}</span>
                    <span>السعر: {formatAmount(o.unit_price)}</span>
                    <span>TVA: {formatTva(o.tva)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReceiptDetail({ receipt, onBack }) {
  const [availableMaterials, setAvailableMaterials] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dealItemId, setDealItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [editError, setEditError] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editModalItem, setEditModalItem] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const rows = await getReceiptItems(receipt.id);
      setItems(rows);
    } catch {
      showToast("حدث خطأ أثناء تحميل المواد الأولية", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableMaterials = async () => {
    try {
      const rows = await getAvailableMaterials(receipt.id);
      setAvailableMaterials(rows);
    } catch {
      showToast("حدث خطأ أثناء تحميل المواد المتاحة", "error");
    }
  };

  useEffect(() => {
    fetchItems();
    fetchAvailableMaterials();
  }, [receipt.id]);

  const selectableMaterials = useMemo(
    () => availableMaterials.filter((m) => !m.already_in_receipt),
    [availableMaterials]
  );

  const selectedMaterial = availableMaterials.find((m) => String(m.deal_item_id) === String(dealItemId));

  const remainingAfter = selectedMaterial && quantity !== ""
    ? Number(selectedMaterial.remaining_qty) - Number(quantity)
    : null;

  const quantityExceeds = selectedMaterial && quantity !== "" && Number(quantity) > Number(selectedMaterial.remaining_qty);

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => ({
        ht: acc.ht + Number(item.total_ht),
        ttc: acc.ttc + Number(item.total_ttc),
      }),
      { ht: 0, ttc: 0 }
    );
  }, [items]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!dealItemId) {
      setFormError("المادة الأولية مطلوبة");
      return;
    }
    if (quantity === "" || Number(quantity) <= 0) {
      setFormError("الكمية يجب أن تكون أكبر من 0");
      return;
    }
    if (quantityExceeds) {
      setFormError(`الكمية المدخلة تتجاوز الكمية المتبقية المتاحة (${selectedMaterial.remaining_qty} ${selectedMaterial.unit})`);
      return;
    }
    setFormError("");
    setSubmitting(true);
    try {
      await addReceiptItem(receipt.id, {
        deal_item_id: dealItemId,
        material_id: selectedMaterial.material_id,
        quantity,
      });
      showToast("تمت إضافة المادة بنجاح");
      setDealItemId("");
      setQuantity("");
      fetchItems();
      fetchAvailableMaterials();
    } catch (err) {
      const message = err.arabicMessage || err?.response?.data?.error || "حدث خطأ أثناء إضافة المادة";
      setFormError(message);
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditQuantity(item.quantity);
    setEditError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditError("");
  };

  const saveEdit = async (item) => {
    if (editQuantity === "" || Number(editQuantity) <= 0) {
      setEditError("الكمية يجب أن تكون أكبر من 0");
      return;
    }
    setEditError("");
    setSavingEdit(true);
    try {
      await updateReceiptItem(receipt.id, item.id, { quantity: editQuantity });
      showToast("تم تحديث الكمية بنجاح");
      setEditingId(null);
      fetchItems();
      fetchAvailableMaterials();
    } catch (err) {
      const message = err.arabicMessage || err?.response?.data?.error || "حدث خطأ أثناء التحديث";
      setEditError(message);
      showToast(message, "error");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await removeReceiptItem(receipt.id, deleteTarget.id);
    showToast("تم حذف المادة بنجاح");
    setDeleteTarget(null);
    fetchItems();
    fetchAvailableMaterials();
  };

  return (
    <div className="space-y-4">

      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
      >
        <ArrowRight size={16} />
        العودة إلى قائمة الوصولات
      </button>

      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: COLOR + "18" }}
        >
          <FileText size={18} style={{ color: COLOR }} />
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 leading-tight">{receipt.reference}</h2>
      </div>

      {/* Info Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">رمز الوصل</p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{receipt.reference}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">المتعامل المتعاقد</p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{receipt.contractor_name}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">المصلحة المتعاقدة</p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{receipt.authority_name}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">الفرع</p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
              {receipt.branch_name}
              {receipt.branch_wilaya ? ` - ${receipt.branch_wilaya}` : ""}
              {receipt.branch_commune ? ` - ${receipt.branch_commune}` : ""}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">تاريخ الوصل</p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{formatDate(receipt.receipt_date)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">أنشئ بواسطة</p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{receipt.created_by_name || "-"}</p>
          </div>
        </div>
      </div>

      {/* Add Material Form */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 sm:p-5">
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">إضافة مادة أولية للوصل</h4>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">المادة الأولية</label>
              <MaterialSearchableSelect
                value={dealItemId}
                options={selectableMaterials}
                error={formError && !dealItemId}
                onChange={(id) => {
                  setDealItemId(id);
                  setQuantity("");
                  setFormError("");
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">الكمية</label>
              <div className="relative">
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  disabled={!selectedMaterial}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="أدخل الكمية"
                  className={`w-full px-3 py-2.5 ${selectedMaterial ? "pl-14" : ""} rounded-lg border text-sm outline-none transition-colors text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-60 disabled:cursor-not-allowed ${
                    quantityExceeds
                      ? "border-red-300 bg-red-50 dark:bg-red-500/10 dark:border-red-500/30"
                      : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700"
                  }`}
                />
                {selectedMaterial && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500">
                    {selectedMaterial.unit}
                  </span>
                )}
              </div>
              {selectedMaterial && quantity !== "" && (
                <p className={`text-xs mt-1 ${quantityExceeds ? "text-red-500 dark:text-red-400" : "text-slate-400 dark:text-slate-500"}`}>
                  المتبقي بعد الإضافة: {formatQuantity(remainingAfter, selectedMaterial.unit)}
                </p>
              )}
            </div>
          </div>

          {/* Info box */}
          {selectedMaterial && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/60 border border-slate-100 dark:border-slate-700">
              <div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">الوحدة</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{selectedMaterial.unit}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">السعر الوحدوي</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{formatAmount(selectedMaterial.unit_price)}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">TVA</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{formatTva(selectedMaterial.tva)}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">الكمية المتبقية في الصفقة</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{formatQuantity(selectedMaterial.remaining_qty, selectedMaterial.unit)}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">الكمية الابتدائية القصوى</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{formatQuantity(selectedMaterial.initial_max_qty, selectedMaterial.unit)}</p>
              </div>
            </div>
          )}

          {formError && (
            <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg">
              <p className="text-red-700 dark:text-red-400 text-sm font-medium text-right">{formError}</p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !selectedMaterial}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-medium shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed bg-green-600"
            >
              <Plus size={16} />
              {submitting ? "جارٍ الإضافة..." : "إضافة المادة"}
            </button>
          </div>
        </form>
      </div>

      {/* Materials Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700">
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">المواد الأولية في الوصل</h4>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div
              className="w-8 h-8 rounded-full border-2 border-slate-100 dark:border-slate-700 animate-spin"
              style={{ borderTopColor: COLOR, borderWidth: "3px" }}
            />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center mb-4">
              <Package size={22} className="text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              لم يتم إضافة أي مادة أولية لهذا الوصل بعد
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="table-fixed w-full min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700 border-b border-slate-100 dark:border-slate-700">
                  <th className="w-12 font-bold text-base tracking-wide px-3 py-3 text-right whitespace-nowrap text-slate-500 dark:text-slate-400">رقم</th>
                  <th className="w-40 font-bold text-base tracking-wide px-3 py-3 text-right whitespace-nowrap text-slate-500 dark:text-slate-400">المادة</th>
                  <th className="w-28 font-bold text-base tracking-wide px-3 py-3 text-right whitespace-nowrap text-slate-500 dark:text-slate-400">الصنف</th>
                  <th className="w-20 font-bold text-base tracking-wide px-3 py-3 text-right whitespace-nowrap text-slate-500 dark:text-slate-400">الوحدة</th>
                  <th className="w-24 font-bold text-base tracking-wide px-3 py-3 text-right whitespace-nowrap text-slate-500 dark:text-slate-400">الكمية</th>
                  <th className="w-32 font-bold text-base tracking-wide px-3 py-3 text-right whitespace-nowrap text-slate-500 dark:text-slate-400">السعر الوحدوي</th>
                  <th className="w-16 font-bold text-base tracking-wide px-3 py-3 text-right whitespace-nowrap text-slate-500 dark:text-slate-400">TVA</th>
                  <th className="w-32 font-bold text-base tracking-wide px-3 py-3 text-right whitespace-nowrap text-slate-500 dark:text-slate-400">المجموع HT</th>
                  <th className="w-32 font-bold text-base tracking-wide px-3 py-3 text-right whitespace-nowrap text-slate-500 dark:text-slate-400">المجموع TTC</th>
                  <th className="w-24 font-bold text-base tracking-wide px-3 py-3 text-right whitespace-nowrap text-slate-500 dark:text-slate-400">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const isEditing = editingId === item.id;
                  return (
                    <tr
                      key={item.id}
                      onDoubleClick={() => !isEditing && setEditModalItem(item)}
                      title="انقر مرتين للتعديل"
                      className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      <td className="font-medium text-sm text-slate-800 dark:text-slate-100 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-mono">
                        {item.id}
                      </td>
                      <td className="font-medium text-sm text-slate-800 dark:text-slate-100 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis">
                        {item.name_ar}
                      </td>
                      <td className="font-medium text-sm text-slate-800 dark:text-slate-100 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis">
                        {item.category_name}
                      </td>
                      <td className="font-medium text-sm text-slate-800 dark:text-slate-100 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis">
                        {item.unit}
                      </td>

                      {isEditing ? (
                        <>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min="0.001"
                              step="0.001"
                              value={editQuantity}
                              onChange={(e) => setEditQuantity(e.target.value)}
                              className={`w-full px-2 py-1.5 rounded-lg border text-sm outline-none text-slate-800 dark:text-slate-100 ${
                                editError ? "border-red-300 dark:border-red-500/30" : "border-slate-200 dark:border-slate-600"
                              } bg-slate-50 dark:bg-slate-700`}
                            />
                          </td>
                          <td className="font-medium text-sm text-slate-800 dark:text-slate-100 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis">
                            {formatAmount(item.unit_price)}
                          </td>
                          <td className="font-medium text-sm text-slate-800 dark:text-slate-100 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis">
                            {formatTva(item.tva)}
                          </td>
                          <td colSpan={2} className="px-3 py-3">
                            {editError && <p className="text-xs text-red-500 dark:text-red-400">{editError}</p>}
                          </td>
                          <td className="font-medium text-sm px-3 py-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => saveEdit(item)}
                                disabled={savingEdit}
                                className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 transition-colors disabled:opacity-50"
                                title="حفظ"
                              >
                                <Check size={15} />
                              </button>
                              <button
                                onClick={cancelEdit}
                                disabled={savingEdit}
                                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                                title="إلغاء"
                              >
                                <X size={15} />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="font-medium text-sm text-slate-800 dark:text-slate-100 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis">
                            {formatQuantity(item.quantity, item.unit)}
                          </td>
                          <td className="font-medium text-sm text-slate-800 dark:text-slate-100 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis">
                            {formatAmount(item.unit_price)}
                          </td>
                          <td className="font-medium text-sm text-slate-800 dark:text-slate-100 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis">
                            {formatTva(item.tva)}
                          </td>
                          <td className="font-medium text-sm text-slate-800 dark:text-slate-100 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis">
                            {formatAmount(item.total_ht)}
                          </td>
                          <td className="font-medium text-sm text-slate-800 dark:text-slate-100 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis">
                            {formatAmount(item.total_ttc)}
                          </td>
                          <td className="font-medium text-sm px-3 py-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => startEdit(item)}
                                className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                                title="تعديل"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(item)}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                title="حذف"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 dark:bg-slate-700 font-bold">
                  <td colSpan={7} className="px-3 py-3 text-right text-sm text-slate-800 dark:text-slate-100">المجموع</td>
                  <td className="px-3 py-3 text-right text-sm text-slate-800 dark:text-slate-100 whitespace-nowrap">{formatAmount(totals.ht)}</td>
                  <td className="px-3 py-3 text-right text-sm text-slate-800 dark:text-slate-100 whitespace-nowrap">{formatAmount(totals.ttc)}</td>
                  <td className="px-3 py-3" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="flex items-center justify-end gap-2 mt-2 px-4 pb-3">
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
              نصيحة: انقر مرتين على أي مادة لتعديل كميتها
            </span>
            <Lightbulb size={16} className="text-yellow-500 shrink-0" />
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteTarget && (
        <ReceiptItemDeleteModal
          item={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Edit Modal */}
      {editModalItem && (
        <ReceiptItemEditModal
          item={editModalItem}
          receiptId={receipt.id}
          remainingQty={
            availableMaterials.find((m) => m.material_id === editModalItem.material_id)?.remaining_qty || 0
          }
          onClose={() => setEditModalItem(null)}
          onSuccess={() => {
            setEditModalItem(null);
            showToast("تم تحديث الكمية بنجاح");
            fetchItems();
            fetchAvailableMaterials();
          }}
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
