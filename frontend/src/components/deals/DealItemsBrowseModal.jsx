"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { X, Search, Pencil, Check, ChevronDown, Package } from "lucide-react";
import { updateDealItem } from "@/services/dealsService";

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
  return `${parseFloat(n).toFixed(2)} ${unit || ""}`.trim();
}

function validateFields({ category_id, tva, min_quantity, max_quantity, unit_price }) {
  const errors = {};
  if (!category_id) errors.category_id = "الصنف مطلوب";
  if (tva === "" || tva === null || tva === undefined) errors.tva = "نسبة الضريبة مطلوبة";
  else if (Number(tva) < 0 || Number(tva) > 100) errors.tva = "يجب أن تكون النسبة بين 0 و 100";
  if (min_quantity === "" || min_quantity === null || min_quantity === undefined) errors.min_quantity = "الكمية الدنيا مطلوبة";
  else if (Number(min_quantity) < 0) errors.min_quantity = "يجب أن تكون الكمية أكبر من أو تساوي 0";
  if (max_quantity === "" || max_quantity === null || max_quantity === undefined) errors.max_quantity = "الكمية القصوى مطلوبة";
  else if (min_quantity !== "" && Number(max_quantity) <= Number(min_quantity)) {
    errors.max_quantity = "يجب أن تكون الكمية القصوى أكبر من الكمية الدنيا";
  }
  if (unit_price === "" || unit_price === null || unit_price === undefined) errors.unit_price = "السعر الوحدوي مطلوب";
  else if (Number(unit_price) < 0.01) errors.unit_price = "يجب أن يكون السعر الوحدوي أكبر من 0";
  return errors;
}

function CategorySelect({ value, options, error, onChange }) {
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

  const selected = options.find((o) => String(o.id) === String(value));

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => o.name_ar.toLowerCase().includes(q));
  }, [query, options]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors flex items-center justify-between gap-2 ${
          error
            ? "border-red-300 bg-red-50 dark:bg-red-500/10 dark:border-red-500/30"
            : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
        }`}
      >
        <span className={selected ? "text-slate-800 dark:text-slate-100 truncate" : "text-slate-400 dark:text-slate-500 truncate"}>
          {selected ? selected.name_ar : "-- اختر صنفاً --"}
        </span>
        <ChevronDown size={16} className="text-slate-400 dark:text-slate-500 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
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
          <div className="max-h-40 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-slate-400 dark:text-slate-500 text-center">لا توجد نتائج</p>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    onChange(o.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`w-full text-right px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                    String(o.id) === String(value) ? "bg-slate-50 dark:bg-slate-700 font-medium" : "text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {o.name_ar}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DealItemsBrowseModal({ dealId, dealReference, items, categories, onClose, onItemUpdated }) {
  const [query, setQuery] = useState("");
  const [localItems, setLocalItems] = useState(items);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editErrors, setEditErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return localItems;
    const q = query.trim().toLowerCase();
    return localItems.filter(
      (it) =>
        it.name_ar?.toLowerCase().includes(q) ||
        it.name_lat?.toLowerCase().includes(q) ||
        it.category_name?.toLowerCase().includes(q)
    );
  }, [query, localItems]);

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditForm({
      category_id: item.category_id,
      tva: item.tva,
      min_quantity: item.min_quantity,
      max_quantity: item.max_quantity,
      unit_price: item.unit_price,
    });
    setEditErrors({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
    setEditErrors({});
  };

  const saveEdit = async (item) => {
    const validationErrors = validateFields(editForm);
    if (Object.keys(validationErrors).length > 0) {
      setEditErrors(validationErrors);
      return;
    }
    setEditErrors({});
    setSaving(true);
    try {
      await updateDealItem(dealId, item.id, editForm);
      const category = categories.find((c) => String(c.id) === String(editForm.category_id));
      setLocalItems((prev) =>
        prev.map((it) =>
          it.id === item.id
            ? { ...it, ...editForm, category_name: category?.name_ar || it.category_name }
            : it
        )
      );
      showToast("تم تحديث المادة بنجاح");
      setEditingId(null);
      setEditForm(null);
      onItemUpdated?.();
    } catch (err) {
      showToast(err.arabicMessage || err?.response?.data?.error || "حدث خطأ أثناء التحديث", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/50 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-800 w-full h-full sm:h-auto sm:max-w-5xl sm:mx-auto sm:mt-10 sm:rounded-xl shadow-2xl flex flex-col max-h-full sm:max-h-[85vh]">
        {/* Header */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">تصفح المواد الأولية للصفقة</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{dealReference}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">عدد المواد: {localItems.length}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar (sticky) */}
        <div className="shrink-0 sticky top-0 z-10 p-3 sm:p-4 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 rounded-lg px-3 py-2.5">
            <Search size={16} className="text-slate-400 dark:text-slate-500 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث باسم المادة أو الصنف..."
              className="bg-transparent text-sm w-full outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Materials List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center mb-4">
                <Package size={22} className="text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                {localItems.length === 0 ? "لم يتم إضافة أي مادة أولية بعد" : "لا توجد مواد تطابق بحثك"}
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const isEditing = editingId === item.id;
              return (
                <div key={item.id} className="border-b border-slate-100 dark:border-slate-700">
                  <div className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <div className="flex-1 min-w-[160px]">
                      <p className="font-medium text-sm text-slate-800 dark:text-slate-100">
                        {item.name_ar}
                        {item.name_lat ? ` - ${item.name_lat}` : ""}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{item.category_name}</p>
                    </div>
                    <div className="w-16 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 shrink-0">{item.unit}</div>
                    <div className="w-16 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 shrink-0">{formatTva(item.tva)}</div>
                    <div className="w-40 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 shrink-0">
                      {formatQuantity(item.min_quantity, item.unit)} → {formatQuantity(item.max_quantity, item.unit)}
                    </div>
                    <div className="w-28 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 shrink-0">
                      {formatAmount(item.unit_price)}
                    </div>
                    <button
                      onClick={() => (isEditing ? cancelEdit() : startEdit(item))}
                      className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors shrink-0"
                      title="تعديل"
                    >
                      <Pencil size={15} />
                    </button>
                  </div>

                  <div
                    className={`grid transition-all duration-200 ease-in-out ${
                      isEditing ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      {isEditing && editForm && (
                        <div className="px-4 pb-4 pt-1 bg-slate-50/60 dark:bg-slate-900/20">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">الصنف</label>
                              <CategorySelect
                                value={editForm.category_id}
                                options={categories}
                                error={editErrors.category_id}
                                onChange={(id) => setEditForm((prev) => ({ ...prev, category_id: id }))}
                              />
                              {editErrors.category_id && (
                                <p className="text-xs text-red-500 dark:text-red-400 mt-1">{editErrors.category_id}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">TVA %</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={editForm.tva}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, tva: e.target.value }))}
                                className={`w-full px-3 py-2 rounded-lg border text-sm outline-none text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700 ${
                                  editErrors.tva ? "border-red-300 dark:border-red-500/30" : "border-slate-200 dark:border-slate-600"
                                }`}
                              />
                              {editErrors.tva && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{editErrors.tva}</p>}
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">الكمية الدنيا</label>
                              <input
                                type="number"
                                min="0"
                                step="0.001"
                                value={editForm.min_quantity}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, min_quantity: e.target.value }))}
                                className={`w-full px-3 py-2 rounded-lg border text-sm outline-none text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700 ${
                                  editErrors.min_quantity ? "border-red-300 dark:border-red-500/30" : "border-slate-200 dark:border-slate-600"
                                }`}
                              />
                              {editErrors.min_quantity && (
                                <p className="text-xs text-red-500 dark:text-red-400 mt-1">{editErrors.min_quantity}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">الكمية القصوى</label>
                              <input
                                type="number"
                                min="0"
                                step="0.001"
                                value={editForm.max_quantity}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, max_quantity: e.target.value }))}
                                className={`w-full px-3 py-2 rounded-lg border text-sm outline-none text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700 ${
                                  editErrors.max_quantity ? "border-red-300 dark:border-red-500/30" : "border-slate-200 dark:border-slate-600"
                                }`}
                              />
                              {editErrors.max_quantity && (
                                <p className="text-xs text-red-500 dark:text-red-400 mt-1">{editErrors.max_quantity}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">السعر الوحدوي</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={editForm.unit_price}
                                  onChange={(e) => setEditForm((prev) => ({ ...prev, unit_price: e.target.value }))}
                                  className={`w-full px-3 py-2 pl-9 rounded-lg border text-sm outline-none text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700 ${
                                    editErrors.unit_price ? "border-red-300 dark:border-red-500/30" : "border-slate-200 dark:border-slate-600"
                                  }`}
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500">دج</span>
                              </div>
                              {editErrors.unit_price && (
                                <p className="text-xs text-red-500 dark:text-red-400 mt-1">{editErrors.unit_price}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => saveEdit(item)}
                              disabled={saving}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-xs sm:text-sm font-medium bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              <Check size={14} />
                              {saving ? "جارٍ الحفظ..." : "حفظ التعديل"}
                            </button>
                            <button
                              onClick={cancelEdit}
                              disabled={saving}
                              className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-medium bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 p-4 sm:p-5 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-400 dark:text-slate-500">عدد النتائج المعروضة: {filtered.length}</p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-slate-600 dark:text-slate-300 text-sm font-medium bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all duration-300 whitespace-nowrap ${
            toast.type === "error" ? "bg-red-500" : "bg-green-600"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
