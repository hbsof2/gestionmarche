"use client";
import { useState } from "react";
import { ArrowRight, Receipt, Download, UserCheck, Building2, Package, Users } from "lucide-react";

const COLOR = "#A93226";

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

function InfoField({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{label}</p>
      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{value || "-"}</p>
    </div>
  );
}

export default function InvoiceDetail({ invoice, onBack }) {
  const [exportLanguage, setExportLanguage] = useState("AR");
  const { contractor, authority, items = [] } = invoice;

  const totals = items.reduce(
    (acc, item) => ({
      ht: acc.ht + Number(item.total_ht),
      ttc: acc.ttc + Number(item.total_ttc),
    }),
    { ht: 0, ttc: 0 }
  );

  return (
    <div className="space-y-4">

      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
      >
        <ArrowRight size={16} />
        العودة إلى قائمة الفواتير
      </button>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: COLOR + "18" }}
          >
            <Receipt size={18} style={{ color: COLOR }} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 leading-tight">{invoice.reference}</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-tight mt-0.5">
              تاريخ الفاتورة: {formatDate(invoice.invoice_date)} · الفترة: {formatDate(invoice.start_date)} ← {formatDate(invoice.end_date)}
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mt-1.5">
              <Users size={14} />
              <span className="font-medium">أنشئ بواسطة:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {invoice.created_by_name || "غير محدد"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <select
            value={exportLanguage}
            onChange={(e) => setExportLanguage(e.target.value)}
            className="px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer w-full sm:w-auto"
          >
            <option value="AR">عربي AR</option>
            <option value="FR">فرنسي FR</option>
          </select>

          <button
            type="button"
            disabled
            title="سيتم تفعيل هذه الخاصية قريباً"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 opacity-50 cursor-not-allowed transition-colors shadow-sm dark:bg-emerald-700 w-full sm:w-auto justify-center"
          >
            <Download size={16} />
            تحميل Excel
          </button>
        </div>
      </div>

      {/* Contractor Info Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <UserCheck size={16} style={{ color: COLOR }} />
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">بيانات المتعامل المتعاقد</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoField label="التعيين" value={contractor?.designation} />
          <InfoField label="الاسم واللقب" value={contractor?.full_name} />
          <InfoField label="تاريخ الميلاد" value={formatDate(contractor?.birth_date)} />
          <InfoField label="الولاية والبلدية" value={contractor ? `${contractor.wilaya} - ${contractor.commune}` : "-"} />
          <InfoField label="الرقم الإحصائي NIS" value={contractor?.nis} />
          <InfoField label="الرقم الجبائي NIF" value={contractor?.nif} />
          {contractor?.ai_number && <InfoField label="رقم المادة AI n°" value={contractor.ai_number} />}
          <InfoField label="رقم السجل التجاري RC" value={contractor?.rc_number} />
          <InfoField label="تاريخ السجل التجاري" value={formatDate(contractor?.rc_date)} />
          <InfoField label="العنوان الكامل" value={contractor?.address} />
          <InfoField label="رقم الهاتف الثابت" value={contractor?.phone_fixed} />
          <InfoField label="رقم الهاتف المحمول" value={contractor?.phone_mobile} />
          {contractor?.fax && <InfoField label="رقم الفاكس" value={contractor.fax} />}
          {contractor?.bank_name && <InfoField label="اسم البنك" value={contractor.bank_name} />}
          {contractor?.bank_address && <InfoField label="عنوان البنك" value={contractor.bank_address} />}
          {contractor?.bank_rip && <InfoField label="رقم الحساب RIP" value={contractor.bank_rip} />}
        </div>
      </div>

      {/* Authority Info Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={16} style={{ color: COLOR }} />
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">بيانات المصلحة المتعاقدة</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoField label="اسم المصلحة" value={authority?.name} />
          <InfoField label="الولاية والبلدية" value={authority ? `${authority.wilaya} - ${authority.commune}` : "-"} />
          <InfoField label="الرقم الإحصائي NIS" value={authority?.nis} />
          <InfoField label="الرقم الجبائي NIF" value={authority?.nif} />
          <InfoField label="رقم السجل التجاري RC" value={authority?.rc_number} />
          <InfoField label="تاريخ السجل التجاري" value={formatDate(authority?.rc_date)} />
          <InfoField label="العنوان الكامل" value={authority?.address} />
          <InfoField label="رقم الهاتف" value={authority?.phone} />
          {authority?.fax && <InfoField label="رقم الفاكس" value={authority.fax} />}
        </div>
      </div>

      {/* Invoice Items Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700">
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">المواد الأولية</h4>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center mb-4">
              <Package size={22} className="text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">لا توجد مواد في هذه الفاتورة</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="table-fixed w-full min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700 border-b border-slate-100 dark:border-slate-700">
                  <th className="w-12 font-bold text-base tracking-wide px-3 py-3 text-right whitespace-nowrap text-slate-500 dark:text-slate-400">رقم</th>
                  <th className="w-36 font-bold text-base tracking-wide px-3 py-3 text-right whitespace-nowrap text-slate-500 dark:text-slate-400">المادة</th>
                  <th className="w-28 font-bold text-base tracking-wide px-3 py-3 text-right whitespace-nowrap text-slate-500 dark:text-slate-400">الصنف</th>
                  <th className="w-20 font-bold text-base tracking-wide px-3 py-3 text-right whitespace-nowrap text-slate-500 dark:text-slate-400">الوحدة</th>
                  <th className="w-28 font-bold text-base tracking-wide px-3 py-3 text-right whitespace-nowrap text-slate-500 dark:text-slate-400">الكمية</th>
                  <th className="w-32 font-bold text-base tracking-wide px-3 py-3 text-right whitespace-nowrap text-slate-500 dark:text-slate-400">السعر الوحدوي</th>
                  <th className="w-16 font-bold text-base tracking-wide px-3 py-3 text-right whitespace-nowrap text-slate-500 dark:text-slate-400">TVA</th>
                  <th className="w-32 font-bold text-base tracking-wide px-3 py-3 text-right whitespace-nowrap text-slate-500 dark:text-slate-400">المجموع HT</th>
                  <th className="w-32 font-bold text-base tracking-wide px-3 py-3 text-right whitespace-nowrap text-slate-500 dark:text-slate-400">المجموع TTC</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id} className="border-b border-slate-100 dark:border-slate-700">
                    <td className="font-medium text-sm text-slate-800 dark:text-slate-100 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis font-mono">
                      {index + 1}
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
                    <td className="font-medium text-sm text-slate-800 dark:text-slate-100 px-3 py-3 text-right whitespace-nowrap overflow-hidden text-ellipsis">
                      {formatQuantity(item.total_quantity, item.unit)}
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
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 dark:bg-slate-700 font-bold">
                  <td colSpan={7} className="px-3 py-3 text-right text-sm text-slate-800 dark:text-slate-100">المجموع</td>
                  <td className="px-3 py-3 text-right text-sm text-slate-800 dark:text-slate-100 whitespace-nowrap">{formatAmount(totals.ht)}</td>
                  <td className="px-3 py-3 text-right text-sm text-slate-800 dark:text-slate-100 whitespace-nowrap">{formatAmount(totals.ttc)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 sm:p-5">
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">المجموع بدون رسوم (HT)</p>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatAmount(totals.ht)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 sm:p-5">
          <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">المجموع بكل الرسوم (TTC)</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatAmount(totals.ttc)}</p>
        </div>
      </div>
    </div>
  );
}
