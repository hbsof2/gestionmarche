"use client";
import { useState, useEffect } from "react";
import { ArrowRight, BarChart3, Download, TrendingDown, TrendingUp } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { getDealStats } from "@/services/dealsService";

const COLOR = "#1E8449";

function formatDate(isoDate) {
  if (!isoDate) return "-";
  const [year, month, day] = isoDate.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function formatAmount(value) {
  return (
    new Intl.NumberFormat("fr-DZ", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value) || 0) + " دج"
  );
}

const CARD_COLORS = {
  blue: { bg: "bg-blue-50 dark:bg-blue-500/10", icon: "text-blue-500", text: "text-blue-700 dark:text-blue-400" },
  indigo: { bg: "bg-indigo-50 dark:bg-indigo-500/10", icon: "text-indigo-500", text: "text-indigo-700 dark:text-indigo-400" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-500/10", icon: "text-emerald-500", text: "text-emerald-700 dark:text-emerald-400" },
  green: { bg: "bg-green-50 dark:bg-green-500/10", icon: "text-green-500", text: "text-green-700 dark:text-green-400" },
};

function StatCard({ color, Icon, value, label, subLabel }) {
  const c = CARD_COLORS[color];
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 sm:p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${c.bg}`}>
        <Icon size={18} className={c.icon} />
      </div>
      <p className={`text-lg sm:text-xl font-bold mb-1 ${c.text}`}>{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{label}</p>
      {subLabel && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subLabel}</p>}
    </div>
  );
}

export default function DealStats({ dealId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getDealStats(dealId)
      .then(setData)
      .catch((err) => setError(err.arabicMessage || "حدث خطأ أثناء تحميل الإحصائيات"))
      .finally(() => setLoading(false));
  }, [dealId]);

  const round2 = (value) => Math.round((parseFloat(value) || 0) * 100) / 100;

  const numFormat = "# ##0.00";
  const monetaireFormat = "#,##0.00";

  const applyNumberFormat = (ws, col, startRow, endRow, format) => {
    for (let row = startRow; row <= endRow; row++) {
      const cellRef = `${col}${row}`;
      if (ws[cellRef] && typeof ws[cellRef].v === "number") {
        ws[cellRef].t = "n";
        ws[cellRef].z = format;
      }
    }
  };

  const exportToExcel = () => {
    const { deal, items, totals } = data;

    const summaryData = [
      { "البيان": "القيمة الدنيا بدون رسوم (HT)", "المبلغ (دج)": round2(totals.total_min_ht) },
      { "البيان": "الرسوم على القيمة الدنيا", "المبلغ (دج)": round2(totals.total_tax_min) },
      { "البيان": "القيمة الدنيا بكل الرسوم (TTC)", "المبلغ (دج)": round2(totals.total_min_ttc) },
      { "البيان": "", "المبلغ (دج)": "" },
      { "البيان": "القيمة القصوى بدون رسوم (HT)", "المبلغ (دج)": round2(totals.total_max_ht) },
      { "البيان": "الرسوم على القيمة القصوى", "المبلغ (دج)": round2(totals.total_tax_max) },
      { "البيان": "القيمة القصوى بكل الرسوم (TTC)", "المبلغ (دج)": round2(totals.total_max_ttc) },
    ];

    const detailsData = items.map((item, index) => ({
      "رقم": index + 1,
      "المادة الأولية": item.name_ar,
      "الصنف": item.category_name,
      "الوحدة": item.unit,
      "TVA %": round2(item.tva),
      "السعر الوحدوي (دج)": round2(item.unit_price),
      "الكمية الدنيا": round2(item.min_quantity),
      "ق.د بدون رسوم (دج)": round2(item.min_total_ht),
      "ق.د بالرسوم (دج)": round2(item.min_total_ttc),
      "الكمية القصوى": round2(item.max_quantity),
      "ق.ق بدون رسوم (دج)": round2(item.max_total_ht),
      "ق.ق بالرسوم (دج)": round2(item.max_total_ttc),
    }));

    detailsData.push({
      "رقم": "",
      "المادة الأولية": "المجموع الإجمالي",
      "الصنف": "",
      "الوحدة": "",
      "TVA %": "",
      "السعر الوحدوي (دج)": "",
      "الكمية الدنيا": "",
      "ق.د بدون رسوم (دج)": round2(totals.total_min_ht),
      "ق.د بالرسوم (دج)": round2(totals.total_min_ttc),
      "الكمية القصوى": "",
      "ق.ق بدون رسوم (دج)": round2(totals.total_max_ht),
      "ق.ق بالرسوم (دج)": round2(totals.total_max_ttc),
    });

    const dealInfoData = [
      { "البيان": "مرجع الصفقة", "القيمة": deal.reference },
      { "البيان": "المتعامل المتعاقد", "القيمة": deal.contractor_name },
      { "البيان": "المصلحة المتعاقدة", "القيمة": deal.authority_name },
      { "البيان": "تاريخ البداية", "القيمة": deal.start_date },
      { "البيان": "تاريخ النهاية", "القيمة": deal.end_date },
      { "البيان": "", "القيمة": "" },
    ];

    const wb = XLSX.utils.book_new();

    const ws1 = XLSX.utils.json_to_sheet(dealInfoData);
    ws1["!cols"] = [{ wch: 25 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, ws1, "معلومات الصفقة");

    const ws2 = XLSX.utils.json_to_sheet(summaryData);
    ws2["!cols"] = [{ wch: 40 }, { wch: 20 }];
    applyNumberFormat(ws2, "B", 2, summaryData.length + 1, monetaireFormat);
    XLSX.utils.book_append_sheet(wb, ws2, "الملخص المالي");

    const ws3 = XLSX.utils.json_to_sheet(detailsData);
    ws3["!cols"] = [
      { wch: 6 }, { wch: 25 }, { wch: 20 }, { wch: 10 },
      { wch: 8 }, { wch: 18 }, { wch: 14 }, { wch: 20 },
      { wch: 20 }, { wch: 14 }, { wch: 20 }, { wch: 20 },
    ];
    ["E", "F", "G", "J"].forEach((col) => {
      applyNumberFormat(ws3, col, 2, detailsData.length + 1, numFormat);
    });
    ["H", "I", "K", "L"].forEach((col) => {
      applyNumberFormat(ws3, col, 2, detailsData.length + 1, monetaireFormat);
    });
    XLSX.utils.book_append_sheet(wb, ws3, "تفاصيل المواد");

    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const filename = `إحصائيات_${deal.reference}_${dateStr}.xlsx`;

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array", cellStyles: true });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, filename);
  };

  return (
    <div className="space-y-4">

      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
      >
        <ArrowRight size={16} />
        العودة إلى الصفقة
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: COLOR + "18" }}
          >
            <BarChart3 size={18} style={{ color: COLOR }} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 leading-tight">إحصائيات الصفقة</h2>
            {data?.deal && (
              <p className="text-sm font-bold leading-tight" style={{ color: COLOR }}>{data.deal.reference}</p>
            )}
          </div>
        </div>
        <button
          onClick={exportToExcel}
          disabled={loading || !data || data.items.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm dark:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 self-start sm:self-auto"
        >
          <Download size={16} />
          تحميل Excel
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div
            className="w-8 h-8 rounded-full border-2 border-slate-100 dark:border-slate-700 animate-spin"
            style={{ borderTopColor: COLOR, borderWidth: "3px" }}
          />
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 text-center">
          <p className="text-sm text-red-500 dark:text-red-400 font-medium">{error}</p>
        </div>
      ) : (
        <>
          {/* Deal info row */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">المتعامل</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{data.deal.contractor_name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">المصلحة</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{data.deal.authority_name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">من تاريخ</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{formatDate(data.deal.start_date)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">إلى تاريخ</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{formatDate(data.deal.end_date)}</p>
              </div>
            </div>
          </div>

          {data.items.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center mb-4">
                  <BarChart3 size={22} className="text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                  لم يتم إضافة أي مادة أولية لهذه الصفقة بعد، لا يمكن عرض الإحصائيات
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  color="blue"
                  Icon={TrendingDown}
                  value={formatAmount(data.totals.total_min_ht)}
                  label="مجموع الكميات الدنيا بدون رسوم"
                />
                <StatCard
                  color="indigo"
                  Icon={TrendingDown}
                  value={formatAmount(data.totals.total_min_ttc)}
                  label="مجموع الكميات الدنيا بكل الرسوم"
                  subLabel={`(الرسوم: ${formatAmount(data.totals.total_tax_min)})`}
                />
                <StatCard
                  color="emerald"
                  Icon={TrendingUp}
                  value={formatAmount(data.totals.total_max_ht)}
                  label="مجموع الكميات القصوى بدون رسوم"
                />
                <StatCard
                  color="green"
                  Icon={TrendingUp}
                  value={formatAmount(data.totals.total_max_ttc)}
                  label="مجموع الكميات القصوى بكل الرسوم"
                  subLabel={`(الرسوم: ${formatAmount(data.totals.total_tax_max)})`}
                />
              </div>

              {/* Detailed table */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700">
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">تفاصيل المواد الأولية</h3>
                </div>
                <div className="overflow-x-auto w-full">
                  <table className="table-fixed w-full min-w-[1400px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-700" style={{ backgroundColor: COLOR + "18" }}>
                        <th className="w-12 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-600 dark:text-slate-300">رقم</th>
                        <th className="w-36 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-600 dark:text-slate-300">المادة الأولية</th>
                        <th className="w-28 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-600 dark:text-slate-300">الصنف</th>
                        <th className="w-20 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-600 dark:text-slate-300">الوحدة</th>
                        <th className="w-16 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-600 dark:text-slate-300">TVA</th>
                        <th className="w-28 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-600 dark:text-slate-300">السعر الوحدوي</th>
                        <th className="w-24 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-600 dark:text-slate-300">الكمية الدنيا</th>
                        <th className="w-32 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-600 dark:text-slate-300">ق.د بدون رسوم</th>
                        <th className="w-32 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-600 dark:text-slate-300">ق.د بالرسوم</th>
                        <th className="w-24 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-600 dark:text-slate-300">الكمية القصوى</th>
                        <th className="w-32 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-600 dark:text-slate-300">ق.ق بدون رسوم</th>
                        <th className="w-32 px-3 py-3 text-right whitespace-nowrap font-bold text-base tracking-wide text-slate-600 dark:text-slate-300">ق.ق بالرسوم</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((item, index) => (
                        <tr key={item.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-700 transition-colors">
                          <td className="w-12 px-3 py-3 text-right whitespace-nowrap font-medium text-sm text-slate-800 dark:text-slate-100 font-mono">{index + 1}</td>
                          <td className="w-36 px-3 py-3 text-right whitespace-nowrap font-medium text-sm text-slate-800 dark:text-slate-100">{item.name_ar}</td>
                          <td className="w-28 px-3 py-3 text-right whitespace-nowrap font-medium text-sm text-slate-800 dark:text-slate-100">{item.category_name}</td>
                          <td className="w-20 px-3 py-3 text-right whitespace-nowrap font-medium text-sm text-slate-800 dark:text-slate-100">{item.unit}</td>
                          <td className="w-16 px-3 py-3 text-right whitespace-nowrap font-medium text-sm text-slate-800 dark:text-slate-100">{item.tva}%</td>
                          <td className="w-28 px-3 py-3 text-right whitespace-nowrap font-medium text-sm text-slate-800 dark:text-slate-100">{formatAmount(item.unit_price)}</td>
                          <td className="w-24 px-3 py-3 text-right whitespace-nowrap font-medium text-sm text-slate-800 dark:text-slate-100">{item.min_quantity}</td>
                          <td className="w-32 px-3 py-3 text-right whitespace-nowrap font-medium text-sm text-slate-800 dark:text-slate-100">{formatAmount(item.min_total_ht)}</td>
                          <td className="w-32 px-3 py-3 text-right whitespace-nowrap font-medium text-sm text-slate-800 dark:text-slate-100">{formatAmount(item.min_total_ttc)}</td>
                          <td className="w-24 px-3 py-3 text-right whitespace-nowrap font-medium text-sm text-slate-800 dark:text-slate-100">{item.max_quantity}</td>
                          <td className="w-32 px-3 py-3 text-right whitespace-nowrap font-medium text-sm text-slate-800 dark:text-slate-100">{formatAmount(item.max_total_ht)}</td>
                          <td className="w-32 px-3 py-3 text-right whitespace-nowrap font-medium text-sm text-slate-800 dark:text-slate-100">{formatAmount(item.max_total_ttc)}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-100 dark:bg-slate-700 font-bold">
                        <td className="w-12 px-3 py-3 text-right whitespace-nowrap text-sm text-slate-800 dark:text-slate-100" colSpan={7}>المجموع الإجمالي</td>
                        <td className="w-32 px-3 py-3 text-right whitespace-nowrap text-sm text-slate-800 dark:text-slate-100">{formatAmount(data.totals.total_min_ht)}</td>
                        <td className="w-32 px-3 py-3 text-right whitespace-nowrap text-sm text-slate-800 dark:text-slate-100">{formatAmount(data.totals.total_min_ttc)}</td>
                        <td className="w-24 px-3 py-3 text-right whitespace-nowrap text-sm text-slate-800 dark:text-slate-100"></td>
                        <td className="w-32 px-3 py-3 text-right whitespace-nowrap text-sm text-slate-800 dark:text-slate-100">{formatAmount(data.totals.total_max_ht)}</td>
                        <td className="w-32 px-3 py-3 text-right whitespace-nowrap text-sm text-slate-800 dark:text-slate-100">{formatAmount(data.totals.total_max_ttc)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
