"use client";
import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { updateDealItem } from "@/services/dealsService";

function validateFields({ tva, min_quantity, max_quantity, unit_price }) {
  const errors = {};
  if (tva === "" || tva === null || tva === undefined) errors.tva = "نسبة الضريبة مطلوبة";
  else if (Number(tva) < 0 || Number(tva) > 100) errors.tva = "يجب أن تكون النسبة بين 0 و 100";
  if (min_quantity === "" || min_quantity === null || min_quantity === undefined) errors.min_quantity = "الكمية الدنيا مطلوبة";
  else if (Number(min_quantity) < 0.01) errors.min_quantity = "يجب أن تكون الكمية أكبر من 0";
  if (max_quantity === "" || max_quantity === null || max_quantity === undefined) errors.max_quantity = "الكمية القصوى مطلوبة";
  else if (min_quantity !== "" && Number(max_quantity) <= Number(min_quantity)) {
    errors.max_quantity = "يجب أن تكون الكمية القصوى أكبر من الكمية الدنيا";
  }
  if (unit_price === "" || unit_price === null || unit_price === undefined) errors.unit_price = "السعر الوحدوي مطلوب";
  else if (Number(unit_price) < 0.01) errors.unit_price = "يجب أن يكون السعر الوحدوي أكبر من 0";
  return errors;
}

function InfoRow({ label, value, unit, colorClass }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-200 dark:border-slate-600 last:border-0">
      <span className={`font-bold text-sm ${colorClass}`}>{value} {unit}</span>
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
    </div>
  );
}

export default function DealItemEditModal({ item, dealId, onClose, onSuccess }) {
  const [form, setForm] = useState({
    tva: item.tva,
    min_quantity: parseFloat(item.min_quantity).toFixed(2),
    max_quantity: parseFloat(item.max_quantity).toFixed(2),
    unit_price: parseFloat(item.unit_price).toFixed(2),
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const initialMaxQty = Number(item.initial_max_qty || item.max_quantity);
  const remainingQty = Number(item.remaining_qty || item.max_quantity);
  const consumedQty = initialMaxQty - remainingQty;
  const remainingColorClass =
    remainingQty > initialMaxQty * 0.2
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-red-600 dark:text-red-400";

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined, submit: undefined }));
  };

  const handleSave = async () => {
    const validationErrors = validateFields(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await updateDealItem(dealId, item.id, form);
      onSuccess?.();
    } catch (err) {
      const message = err.arabicMessage || err?.response?.data?.error || "حدث خطأ أثناء التحديث";
      setErrors({ submit: message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">تعديل مادة أولية</h3>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Read-only info */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-700">
            <div className="col-span-2">
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">اسم المادة</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                {item.name_ar}{item.name_lat ? ` - ${item.name_lat}` : ""}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">الصنف</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{item.category_name}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">الوحدة</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{item.unit}</p>
            </div>
          </div>

          {/* Remaining quantity tracking */}
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-700">
            <InfoRow
              label="الكمية الابتدائية القصوى"
              value={parseFloat(initialMaxQty).toFixed(2)}
              unit={item.unit}
              colorClass="text-slate-800 dark:text-slate-100"
            />
            <InfoRow
              label="الكمية المستهلكة في الوصولات"
              value={parseFloat(consumedQty).toFixed(2)}
              unit={item.unit}
              colorClass="text-orange-600 dark:text-orange-400"
            />
            <InfoRow
              label="الكمية المتبقية"
              value={parseFloat(remainingQty).toFixed(2)}
              unit={item.unit}
              colorClass={remainingColorClass}
            />
          </div>

          {/* TVA */}
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
                onChange={handleChange("tva")}
                className={`w-full px-3 py-2.5 pl-9 rounded-lg border text-sm outline-none transition-colors text-slate-800 dark:text-slate-100 ${
                  errors.tva
                    ? "border-red-300 bg-red-50 dark:bg-red-500/10 dark:border-red-500/30"
                    : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700"
                }`}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500">%</span>
            </div>
            {errors.tva && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.tva}</p>}
          </div>

          {/* Min quantity */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">الكمية الدنيا</label>
            <div className="relative">
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.min_quantity}
                onChange={handleChange("min_quantity")}
                className={`w-full px-3 py-2.5 pl-14 rounded-lg border text-sm outline-none transition-colors text-slate-800 dark:text-slate-100 ${
                  errors.min_quantity
                    ? "border-red-300 bg-red-50 dark:bg-red-500/10 dark:border-red-500/30"
                    : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700"
                }`}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500">{item.unit}</span>
            </div>
            {errors.min_quantity && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.min_quantity}</p>}
          </div>

          {/* Max quantity */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">الكمية القصوى</label>
            <div className="relative">
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.max_quantity}
                onChange={handleChange("max_quantity")}
                className={`w-full px-3 py-2.5 pl-14 rounded-lg border text-sm outline-none transition-colors text-slate-800 dark:text-slate-100 ${
                  errors.max_quantity
                    ? "border-red-300 bg-red-50 dark:bg-red-500/10 dark:border-red-500/30"
                    : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700"
                }`}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500">{item.unit}</span>
            </div>
            {errors.max_quantity && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.max_quantity}</p>}
          </div>

          {/* Unit price */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">السعر الوحدوي</label>
            <div className="relative">
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.unit_price}
                onChange={handleChange("unit_price")}
                className={`w-full px-3 py-2.5 pl-9 rounded-lg border text-sm outline-none transition-colors text-slate-800 dark:text-slate-100 ${
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
            <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg">
              <p className="text-red-700 dark:text-red-400 text-sm font-medium text-right">{errors.submit}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 pt-0 flex flex-col sm:flex-row-reverse gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-medium bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? "جارٍ الحفظ..." : "حفظ التعديل"}
          </button>
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 text-sm font-medium bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
