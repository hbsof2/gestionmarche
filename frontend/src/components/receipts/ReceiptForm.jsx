"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { X, ChevronDown, Search } from "lucide-react";
import { getAll as getContractors } from "@/services/contractorsService";
import { getAll as getAuthorities } from "@/services/contractingAuthorityService";
import {
  getDealsByContractorAndAuthority,
  getDealBranchesForReceipt,
  getNextCounter,
} from "@/services/receiptsService";

const COLOR = "#2471A3";

const MONTHS = [
  "جانفي", "فيفري", "مارس", "أفريل", "ماي", "جوان",
  "جويلية", "أوت", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR + 1 - 2020 + 1 }, (_, i) => 2020 + i);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

function pad(n) {
  return String(n).padStart(2, "0");
}

function parseDate(isoDate) {
  const today = new Date();
  if (!isoDate) {
    return { day: today.getDate(), month: today.getMonth() + 1, year: today.getFullYear() };
  }
  const [year, month, day] = isoDate.slice(0, 10).split("-");
  return { day: parseInt(day, 10), month: parseInt(month, 10), year: parseInt(year, 10) };
}

function SearchableSelect({ value, options, getLabel, placeholder, error, onChange }) {
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
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors flex items-center justify-between gap-2 ${
          error
            ? "border-red-300 bg-red-50 dark:bg-red-500/10 dark:border-red-500/30"
            : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700"
        }`}
      >
        <span className={selected ? "text-slate-800 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"}>
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

function StepLabel({ number, title }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
        style={{ backgroundColor: COLOR }}
      >
        {number}
      </span>
      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h4>
    </div>
  );
}

export default function ReceiptForm({ receipt, onSave, onCancel }) {
  const isEdit = Boolean(receipt);
  const initialDate = parseDate(receipt?.receipt_date);

  const [contractorId, setContractorId] = useState(receipt?.contractor_id || "");
  const [authorityId, setAuthorityId] = useState(receipt?.authority_id || "");
  const [dealId, setDealId] = useState(receipt?.deal_id || "");
  const [branchId, setBranchId] = useState(receipt?.branch_id || "");

  const [day, setDay] = useState(initialDate.day);
  const [month, setMonth] = useState(initialDate.month);
  const [year, setYear] = useState(initialDate.year);

  const [contractors, setContractors] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [deals, setDeals] = useState([]);
  const [branches, setBranches] = useState([]);
  const [dealsLoading, setDealsLoading] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [nextCounter, setNextCounter] = useState(null);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getContractors(1, "", 1000).then((res) => setContractors(res.data || []));
    getAuthorities(1, "", 1000).then((res) => setAuthorities(res.data || []));
  }, []);

  useEffect(() => {
    if (isEdit || !contractorId || !authorityId) { setDeals([]); return; }
    setDealsLoading(true);
    getDealsByContractorAndAuthority(contractorId, authorityId)
      .then(setDeals)
      .finally(() => setDealsLoading(false));
  }, [contractorId, authorityId, isEdit]);

  useEffect(() => {
    if (!dealId) { setBranches([]); return; }
    setBranchesLoading(true);
    getDealBranchesForReceipt(dealId)
      .then(setBranches)
      .finally(() => setBranchesLoading(false));
  }, [dealId]);

  useEffect(() => {
    if (isEdit || !dealId) { setNextCounter(null); return; }
    getNextCounter(dealId).then((res) => setNextCounter(res.next_counter));
  }, [dealId, isEdit]);

  const set = (field, value) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleContractorChange = (id) => {
    setContractorId(id);
    setDealId("");
    setBranchId("");
    set("contractor_id");
  };

  const handleAuthorityChange = (id) => {
    setAuthorityId(id);
    setDealId("");
    setBranchId("");
    set("authority_id");
  };

  const handleDealChange = (id) => {
    setDealId(id);
    setBranchId("");
    set("deal_id");
  };

  const handleBranchChange = (id) => {
    setBranchId(id);
    set("branch_id");
  };

  const selectedDeal = deals.find((d) => String(d.id) === String(dealId));
  const dealReference = isEdit ? receipt.deal_reference : selectedDeal?.reference;
  const referenceDisplay = isEdit
    ? receipt.reference
    : dealReference && nextCounter
    ? `${dealReference}-${nextCounter}`
    : "";

  const validate = () => {
    const errs = {};
    if (!contractorId) errs.contractor_id = "المتعامل المتعاقد مطلوب";
    if (!authorityId) errs.authority_id = "المصلحة المتعاقدة مطلوبة";
    if (!dealId) errs.deal_id = "الصفقة مطلوبة";
    if (!branchId) errs.branch_id = "فرع المصلحة مطلوب";
    if (!(day && month && year)) errs.receipt_date = "تاريخ الوصل مطلوب";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const receipt_date = `${year}-${pad(month)}-${pad(day)}`;
      if (isEdit) {
        await onSave({ receipt_date, branch_id: branchId }, receipt.id);
      } else {
        await onSave({
          deal_id: dealId,
          contractor_id: contractorId,
          authority_id: authorityId,
          branch_id: branchId,
          receipt_date,
        });
      }
    } catch (err) {
      setErrors({ submit: err.arabicMessage || err.response?.data?.error || "حدث خطأ أثناء الحفظ" });
    } finally {
      setSubmitting(false);
    }
  };

  const getBranchLabel = (b) => `${b.name} - ${b.wilaya} - ${b.commune}`;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 rounded-t-2xl">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            {isEdit ? "تعديل الوصل" : "إنشاء وصل جديد"}
          </h3>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">

          {/* Step 1 */}
          <div>
            <StepLabel number={1} title="تحديد المتعامل والمصلحة" />
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  المتعامل المتعاقد <span className="text-red-500">*</span>
                </label>
                {isEdit ? (
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-700 rounded-lg px-3 py-2.5">
                    {receipt.contractor_name}
                  </p>
                ) : (
                  <>
                    <SearchableSelect
                      value={contractorId}
                      options={contractors}
                      getLabel={(c) => `${c.designation} - ${c.full_name}`}
                      placeholder="-- اختر المتعامل المتعاقد --"
                      error={errors.contractor_id}
                      onChange={handleContractorChange}
                    />
                    {errors.contractor_id && <p className="text-xs text-red-500 mt-1">{errors.contractor_id}</p>}
                  </>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  المصلحة المتعاقدة <span className="text-red-500">*</span>
                </label>
                {isEdit ? (
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-700 rounded-lg px-3 py-2.5">
                    {receipt.authority_name}
                  </p>
                ) : (
                  <>
                    <SearchableSelect
                      value={authorityId}
                      options={authorities}
                      getLabel={(a) => a.name}
                      placeholder="-- اختر المصلحة المتعاقدة --"
                      error={errors.authority_id}
                      onChange={handleAuthorityChange}
                    />
                    {errors.authority_id && <p className="text-xs text-red-500 mt-1">{errors.authority_id}</p>}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Step 2 */}
          {(isEdit || (contractorId && authorityId)) && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 animate-[fade-in_0.3s_ease-out]">
              <StepLabel number={2} title="تحديد الصفقة" />
              {isEdit ? (
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-700 rounded-lg px-3 py-2.5">
                  {receipt.deal_reference}
                </p>
              ) : dealsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-slate-100 dark:border-slate-700 animate-spin"
                    style={{ borderTopColor: COLOR, borderWidth: "2px" }}
                  />
                </div>
              ) : deals.length === 0 ? (
                <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded-lg px-3 py-2.5">
                  لا توجد صفقات بين هذا المتعامل وهذه المصلحة
                </p>
              ) : (
                <>
                  <SearchableSelect
                    value={dealId}
                    options={deals}
                    getLabel={(d) => d.reference}
                    placeholder="-- اختر الصفقة --"
                    error={errors.deal_id}
                    onChange={handleDealChange}
                  />
                  {errors.deal_id && <p className="text-xs text-red-500 mt-1">{errors.deal_id}</p>}
                </>
              )}
            </div>
          )}

          {/* Step 3 */}
          {dealId && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 animate-[fade-in_0.3s_ease-out]">
              <StepLabel number={3} title="تحديد الفرع" />
              {branchesLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-slate-100 dark:border-slate-700 animate-spin"
                    style={{ borderTopColor: COLOR, borderWidth: "2px" }}
                  />
                </div>
              ) : branches.length === 0 ? (
                <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded-lg px-3 py-2.5">
                  لا توجد فروع مرتبطة بهذه الصفقة
                </p>
              ) : (
                <>
                  <SearchableSelect
                    value={branchId}
                    options={branches}
                    getLabel={getBranchLabel}
                    placeholder="-- اختر فرع المصلحة --"
                    error={errors.branch_id}
                    onChange={handleBranchChange}
                  />
                  {errors.branch_id && <p className="text-xs text-red-500 mt-1">{errors.branch_id}</p>}
                </>
              )}
            </div>
          )}

          {/* Step 4 */}
          {branchId && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 animate-[fade-in_0.3s_ease-out] space-y-4">
              <StepLabel number={4} title="التاريخ والمرجع" />

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  تاريخ الوصل <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={day}
                    onChange={(e) => setDay(parseInt(e.target.value, 10))}
                    className={`w-full px-2 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
                      errors.receipt_date
                        ? "border-red-300 bg-red-50 dark:bg-red-500/10 dark:border-red-500/30"
                        : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100"
                    }`}
                  >
                    <option value="">اليوم</option>
                    {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select
                    value={month}
                    onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                    className={`w-full px-2 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
                      errors.receipt_date
                        ? "border-red-300 bg-red-50 dark:bg-red-500/10 dark:border-red-500/30"
                        : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100"
                    }`}
                  >
                    <option value="">الشهر</option>
                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                  <select
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value, 10))}
                    className={`w-full px-2 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
                      errors.receipt_date
                        ? "border-red-300 bg-red-50 dark:bg-red-500/10 dark:border-red-500/30"
                        : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100"
                    }`}
                  >
                    <option value="">السنة</option>
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                {errors.receipt_date && <p className="text-xs text-red-500 mt-1">{errors.receipt_date}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  رمز الوصل (يُنشأ تلقائياً)
                </label>
                <p
                  dir="ltr"
                  className="text-right px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-mono"
                >
                  {referenceDisplay || "..."}
                </p>
              </div>
            </div>
          )}

          {/* Submit error */}
          {errors.submit && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2.5 border border-red-100 dark:border-red-500/30">
              {errors.submit}
            </p>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium transition-opacity disabled:opacity-60 bg-green-600 hover:bg-green-700"
            >
              {submitting ? "جارٍ الحفظ..." : isEdit ? "حفظ التعديلات" : "إنشاء الوصل"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 text-sm font-medium bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
