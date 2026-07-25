"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { Plus, Trash2, Pencil, Check, X, Package, Search, ChevronDown, Lightbulb } from "lucide-react";
import { getAll as getRawMaterials } from "@/services/rawMaterialsService";
import { getAll as getMaterialCategories } from "@/services/materialCategoriesService";
import {
  getDealItems,
  addDealItem,
  updateDealItem,
  removeDealItem,
} from "@/services/dealsService";
import DealItemsBrowseModal from "./DealItemsBrowseModal";
import DealItemEditModal from "./DealItemEditModal";

const COLOR = "#1E8449";

const EMPTY_FORM = {
  material_id: "",
  category_id: "",
  tva: "",
  min_quantity: "",
  max_quantity: "",
  unit_price: "",
};

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

function SearchableSelect({ value, options, getLabel, placeholder, error, onChange, disabled }) {
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
    return options.filter((o) => getLabel(o).toLowerCase().includes(q));
  }, [query, options, getLabel]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors flex items-center justify-between gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${
          error
            ? "border-red-300 bg-red-50 dark:bg-red-500/10 dark:border-red-500/30"
            : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700"
        }`}
      >
        <span className={selected ? "text-slate-800 dark:text-slate-100 truncate" : "text-slate-400 dark:text-slate-500 truncate"}>
          {selected ? getLabel(selected) : placeholder}
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
          <div className="max-h-48 overflow-y-auto">
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
                  {getLabel(o)}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function validateItem({ material_id, category_id, tva, min_quantity, max_quantity, unit_price }) {
  const errors = {};
  if (!material_id) errors.material_id = "المادة الأولية مطلوبة";
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

export default function DealItems({ dealId, dealReference }) {
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editErrors, setEditErrors] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [toast, setToast] = useState(null);
  const [showBrowseModal, setShowBrowseModal] = useState(false);
  const [editModalItem, setEditModalItem] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const rows = await getDealItems(dealId);
      setItems(rows);
    } catch {
      showToast("حدث خطأ أثناء تحميل المواد الأولية", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    getRawMaterials(1, "", 1000).then((res) => setMaterials(res.data || []));
    getMaterialCategories("").then((rows) => setCategories(rows || []));
  }, [dealId]);

  const selectedMaterial = materials.find((m) => String(m.id) === String(form.material_id));

  const getMaterialLabel = (m) => `${m.name_ar}${m.name_lat ? " - " + m.name_lat : ""} (${m.unit})`;
  const getCategoryLabel = (c) => c.name_ar;

  const handleAdd = async (e) => {
    e.preventDefault();
    const validationErrors = validateItem(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await addDealItem(dealId, {
        material_id: form.material_id,
        category_id: form.category_id,
        tva: form.tva,
        min_quantity: form.min_quantity,
        max_quantity: form.max_quantity,
        unit_price: form.unit_price,
      });
      showToast("تمت إضافة المادة بنجاح");
      setForm((prev) => ({ ...prev, material_id: "", category_id: "" }));
      fetchItems();
    } catch (err) {
      const message = err.arabicMessage || err?.response?.data?.error || "حدث خطأ أثناء إضافة المادة";
      setErrors({ submit: message });
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditForm({
      material_id: item.material_id,
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
    setEditErrors({});
  };

  const saveEdit = async (item) => {
    const validationErrors = validateItem(editForm);
    if (Object.keys(validationErrors).length > 0) {
      setEditErrors(validationErrors);
      return;
    }
    setEditErrors({});
    setSavingEdit(true);
    try {
      await updateDealItem(dealId, item.id, {
        tva: editForm.tva,
        min_quantity: editForm.min_quantity,
        max_quantity: editForm.max_quantity,
        unit_price: editForm.unit_price,
      });
      showToast("تم تحديث المادة بنجاح");
      setEditingId(null);
      fetchItems();
    } catch (err) {
      showToast(err.arabicMessage || "حدث خطأ أثناء التحديث", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await removeDealItem(dealId, deleteTarget.id);
      showToast("تم حذف المادة بنجاح");
      setDeleteTarget(null);
      fetchItems();
    } catch (err) {
      const message = err.arabicMessage || err?.response?.data?.error || "حدث خطأ أثناء الحذف";
      setDeleteError(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">المواد الأولية للصفقة</h3>

      {/* Add Material Form */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 sm:p-5">
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">إضافة مادة أولية</h4>
        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">المادة الأولية</label>
            <SearchableSelect
              value={form.material_id}
              options={materials}
              getLabel={getMaterialLabel}
              placeholder="-- اختر مادة أولية --"
              error={errors.material_id}
              onChange={(id) => setForm((prev) => ({ ...prev, material_id: id }))}
            />
            {errors.material_id && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.material_id}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">الصنف</label>
            <SearchableSelect
              value={form.category_id}
              options={categories}
              getLabel={getCategoryLabel}
              placeholder="-- اختر صنفاً --"
              error={errors.category_id}
              onChange={(id) => setForm((prev) => ({ ...prev, category_id: id }))}
            />
            {errors.category_id && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.category_id}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              الضريبة على القيمة المضافة TVA %
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.tva}
                onChange={(e) => setForm((prev) => ({ ...prev, tva: e.target.value }))}
                placeholder="مثال: 19"
                className={`w-full px-3 py-2.5 pl-9 rounded-lg border text-sm outline-none transition-colors text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                  errors.tva
                    ? "border-red-300 bg-red-50 dark:bg-red-500/10 dark:border-red-500/30"
                    : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700"
                }`}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500">%</span>
            </div>
            {errors.tva && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.tva}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">الكمية الدنيا</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.001"
                value={form.min_quantity}
                onChange={(e) => setForm((prev) => ({ ...prev, min_quantity: e.target.value }))}
                placeholder="الكمية الدنيا"
                className={`w-full px-3 py-2.5 ${selectedMaterial ? "pl-14" : ""} rounded-lg border text-sm outline-none transition-colors text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                  errors.min_quantity
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
            {errors.min_quantity && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.min_quantity}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">الكمية القصوى</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.001"
                value={form.max_quantity}
                onChange={(e) => setForm((prev) => ({ ...prev, max_quantity: e.target.value }))}
                placeholder="الكمية القصوى"
                className={`w-full px-3 py-2.5 ${selectedMaterial ? "pl-14" : ""} rounded-lg border text-sm outline-none transition-colors text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                  errors.max_quantity
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
            {errors.max_quantity && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.max_quantity}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">السعر الوحدوي</label>
            <div className="relative">
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.unit_price}
                onChange={(e) => setForm((prev) => ({ ...prev, unit_price: e.target.value }))}
                placeholder="0.00"
                className={`w-full px-3 py-2.5 pl-9 rounded-lg border text-sm outline-none transition-colors text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                  errors.unit_price
                    ? "border-red-300 bg-red-50 dark:bg-red-500/10 dark:border-red-500/30"
                    : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700"
                }`}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500">دج</span>
            </div>
            {errors.unit_price && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.unit_price}</p>}
          </div>

          {errors.submit && (
            <div className="sm:col-span-2 lg:col-span-3 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg">
              <p className="text-red-700 dark:text-red-400 text-sm font-medium text-right">{errors.submit}</p>
            </div>
          )}

          <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
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
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3">
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">قائمة المواد الأولية المضافة</h4>
          <button
            onClick={() => setShowBrowseModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
                       font-medium bg-blue-50 text-blue-600
                       hover:bg-blue-100 transition-colors
                       dark:bg-blue-900/30 dark:text-blue-400
                       dark:hover:bg-blue-900/50"
          >
            <Search size={15} />
            تصفح
          </button>
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
              لم يتم إضافة أي مادة أولية لهذه الصفقة بعد
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="table-fixed w-full min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700 border-b border-slate-100 dark:border-slate-700">
                  <th className="w-12 font-bold text-base tracking-wide px-3 py-3 text-right whitespace-nowrap text-slate-500 dark:text-slate-400">رقم</th>
                  <th className="w-40 font-bold text-base tracking-wide px-3 py-3 text-right whitespace-nowrap text-slate-500 dark:text-slate-400">المادة الأولية</th>
                  <th className="w-32 font-bold text-base tracking-wide px-3 py-3 text-right whitespace-nowrap text-slate-500 dark:text-slate-400">الصنف</th>
                  <th className="w-20 font-bold text-base tracking-wide px-3 py-3 text-right whitespace-nowrap text-slate-500 dark:text-slate-400">الوحدة</th>
                  <th className="w-20 font-bold text-base tracking-wide px-3 py-3 text-right whitespace-nowrap text-slate-500 dark:text-slate-400">TVA %</th>
                  <th className="w-28 font-bold text-base tracking-wide px-3 py-3 text-right whitespace-nowrap text-slate-500 dark:text-slate-400">الكمية الدنيا</th>
                  <th className="w-28 font-bold text-base tracking-wide px-3 py-3 text-right whitespace-nowrap text-slate-500 dark:text-slate-400">الكمية القصوى</th>
                  <th className="w-32 font-bold text-base tracking-wide px-3 py-3 text-right whitespace-nowrap text-slate-500 dark:text-slate-400">السعر الوحدوي</th>
                  <th className="w-24 font-bold text-base tracking-wide px-3 py-3 text-right whitespace-nowrap text-slate-500 dark:text-slate-400">الإجراءات</th>
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
                      <td className="w-12 font-medium text-sm text-slate-800 dark:text-slate-100 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-mono">
                        {item.id}
                      </td>
                      <td className="w-40 font-medium text-sm text-slate-800 dark:text-slate-100 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis">
                        {item.name_ar}
                      </td>
                      <td className="w-32 font-medium text-sm text-slate-800 dark:text-slate-100 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis">
                        {item.category_name}
                      </td>
                      <td className="w-20 font-medium text-sm text-slate-800 dark:text-slate-100 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis">
                        {item.unit}
                      </td>

                      {isEditing ? (
                        <>
                          <td className="w-20 px-2 py-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={editForm.tva}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, tva: e.target.value }))}
                              className={`w-full px-2 py-1.5 rounded-lg border text-sm outline-none text-slate-800 dark:text-slate-100 ${
                                editErrors.tva ? "border-red-300 dark:border-red-500/30" : "border-slate-200 dark:border-slate-600"
                              } bg-slate-50 dark:bg-slate-700`}
                            />
                          </td>
                          <td className="w-28 px-2 py-2">
                            <input
                              type="number"
                              min="0"
                              step="0.001"
                              value={editForm.min_quantity}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, min_quantity: e.target.value }))}
                              className={`w-full px-2 py-1.5 rounded-lg border text-sm outline-none text-slate-800 dark:text-slate-100 ${
                                editErrors.min_quantity ? "border-red-300 dark:border-red-500/30" : "border-slate-200 dark:border-slate-600"
                              } bg-slate-50 dark:bg-slate-700`}
                            />
                          </td>
                          <td className="w-28 px-2 py-2">
                            <input
                              type="number"
                              min="0"
                              step="0.001"
                              value={editForm.max_quantity}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, max_quantity: e.target.value }))}
                              className={`w-full px-2 py-1.5 rounded-lg border text-sm outline-none text-slate-800 dark:text-slate-100 ${
                                editErrors.max_quantity ? "border-red-300 dark:border-red-500/30" : "border-slate-200 dark:border-slate-600"
                              } bg-slate-50 dark:bg-slate-700`}
                            />
                          </td>
                          <td className="w-32 px-2 py-2">
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={editForm.unit_price}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, unit_price: e.target.value }))}
                              className={`w-full px-2 py-1.5 rounded-lg border text-sm outline-none text-slate-800 dark:text-slate-100 ${
                                editErrors.unit_price ? "border-red-300 dark:border-red-500/30" : "border-slate-200 dark:border-slate-600"
                              } bg-slate-50 dark:bg-slate-700`}
                            />
                          </td>
                          <td className="w-24 font-medium text-sm px-3 py-3 text-right whitespace-nowrap">
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
                          <td className="w-20 font-medium text-sm text-slate-800 dark:text-slate-100 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis">
                            {formatTva(item.tva)}
                          </td>
                          <td className="w-28 font-medium text-sm text-slate-800 dark:text-slate-100 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis">
                            {formatQuantity(item.min_quantity, item.unit)}
                          </td>
                          <td className="w-28 font-medium text-sm text-slate-800 dark:text-slate-100 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis">
                            {formatQuantity(item.max_quantity, item.unit)}
                          </td>
                          <td className="w-32 font-medium text-sm text-slate-800 dark:text-slate-100 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis">
                            {formatAmount(item.unit_price)}
                          </td>
                          <td className="w-24 font-medium text-sm px-3 py-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => startEdit(item)}
                                className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                                title="تعديل"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteError(null);
                                  setDeleteTarget(item);
                                }}
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
            </table>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="flex items-center justify-end gap-2 mt-2 px-4 pb-4">
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
              نصيحة: انقر مرتين على أي مادة لتعديلها
            </span>
            <Lightbulb size={16} className="text-yellow-500 shrink-0" />
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2">تأكيد الحذف</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">هل أنت متأكد من حذف المادة:</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">&quot;{deleteTarget.name_ar}&quot;</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">لا يمكن التراجع عن هذا الإجراء</p>

              {deleteError && (
                <div className="mt-3 mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-700 dark:text-red-400 text-sm font-medium text-right">{deleteError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {deleting ? "جارٍ الحذف..." : "حذف"}
                </button>
                <button
                  onClick={() => {
                    setDeleteTarget(null);
                    setDeleteError(null);
                  }}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 text-sm font-medium bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
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

      {/* Browse Modal */}
      {showBrowseModal && (
        <DealItemsBrowseModal
          dealId={dealId}
          dealReference={dealReference}
          items={items}
          categories={categories}
          onClose={() => setShowBrowseModal(false)}
          onItemUpdated={() => fetchItems()}
        />
      )}

      {/* Edit Modal */}
      {editModalItem && (
        <DealItemEditModal
          item={editModalItem}
          dealId={dealId}
          onClose={() => setEditModalItem(null)}
          onSuccess={() => {
            setEditModalItem(null);
            showToast("تم تحديث المادة بنجاح");
            fetchItems();
          }}
        />
      )}
    </div>
  );
}
