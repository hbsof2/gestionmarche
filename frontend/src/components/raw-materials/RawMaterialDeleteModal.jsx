"use client";
import { Trash2 } from "lucide-react";

export default function RawMaterialDeleteModal({ material, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <Trash2 size={24} className="text-red-500" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-2">تأكيد الحذف</h3>
          <p className="text-sm text-slate-500 mb-1">هل أنت متأكد من حذف المادة:</p>
          <p className="text-sm font-bold text-slate-800 mb-2">"{material.name_ar}"</p>
          <p className="text-xs text-slate-400 mb-6">لا يمكن التراجع عن هذا الإجراء</p>
          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium bg-red-500 hover:bg-red-600 transition-colors"
            >
              حذف
            </button>
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl text-slate-600 text-sm font-medium bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
