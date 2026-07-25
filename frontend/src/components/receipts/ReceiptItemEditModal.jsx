"use client";
import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { updateReceiptItem } from "@/services/receiptsService";

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

export default function ReceiptItemEditModal({ item, receiptId, remainingQty, onClose, onSuccess }) {
  const currentQuantity = Number(item.quantity);
  const available = Number(remainingQty) + currentQuantity;

  const [quantity, setQuantity] = useState(parseFloat(item.quantity).toFixed(2));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const numericQuantity = quantity === "" ? null : Number(quantity);
  const remainingAfter = numericQuantity !== null ? available - numericQuantity : null;
  const exceeds = numericQuantity !== null && numericQuantity > available;
  const invalid = numericQuantity === null || numericQuantity <= 0;
  const unchanged = numericQuantity === currentQuantity;

  const handleSave = async () => {
    if (invalid) {
      setError("يجب أن تكون الكمية أكبر من الصفر");
      return;
    }
    if (exceeds) {
      setError(`الكمية تتجاوز المتاح (${formatQuantity(available, item.unit)})`);
      return;
    }
    setError("");
    setSaving(true);
    try {
      await updateReceiptItem(receiptId, item.id, { quantity });
      onSuccess?.();
    } catch (err) {
      const message = err.arabicMessage || err?.response?.data?.error || "حدث خطأ أثناء التحديث";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">تعديل كمية المادة الأولية</h3>
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
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-700">
            <div className="col-span-2">
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">اسم المادة</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                {item.name_ar}{item.name_lat ? ` - ${item.name_lat}` : ""}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">الوحدة</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{item.unit}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">السعر الوحدوي</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{formatAmount(item.unit_price)}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">TVA</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{formatTva(item.tva)}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">الكمية الحالية</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{formatQuantity(currentQuantity, item.unit)}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">الكمية المتبقية في الصفقة</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{formatQuantity(available, item.unit)}</p>
            </div>
          </div>

          {/* Quantity input */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">الكمية الجديدة</label>
            <div className="relative">
              <input
                type="number"
                min="0.001"
                step="0.001"
                autoFocus
                value={quantity}
                onChange={(e) => { setQuantity(e.target.value); setError(""); }}
                className={`w-full px-3 py-2.5 pl-14 rounded-lg border text-sm outline-none transition-colors text-slate-800 dark:text-slate-100 ${
                  error
                    ? "border-red-300 bg-red-50 dark:bg-red-500/10 dark:border-red-500/30"
                    : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700"
                }`}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500">
                {item.unit}
              </span>
            </div>

            {numericQuantity !== null && !invalid && (
              <p className={`text-xs mt-1 ${exceeds ? "text-red-500 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                المتبقي بعد التعديل: {formatQuantity(remainingAfter, item.unit)}
              </p>
            )}

            {error && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">{error}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 pt-0 flex flex-col sm:flex-row-reverse gap-3">
          <button
            onClick={handleSave}
            disabled={saving || invalid || exceeds || unchanged}
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
