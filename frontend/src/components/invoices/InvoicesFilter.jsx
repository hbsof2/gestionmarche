"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { Filter, Search, X, ChevronDown, Plus, Loader2 } from "lucide-react";
import {
  getFilterOptions,
  getDealsByContractorAndAuthority,
  create,
} from "@/services/invoicesService";

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

const today = new Date();
const firstDayOfMonth = { day: 1, month: today.getMonth() + 1, year: today.getFullYear() };
const todayDate = { day: today.getDate(), month: today.getMonth() + 1, year: today.getFullYear() };

function FilterSearchableSelect({ value, options, getLabel, placeholder, onChange, disabled, disabledMessage }) {
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
        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm outline-none transition-colors flex items-center justify-between gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <span className={selected ? "text-slate-800 dark:text-slate-100 truncate" : "text-slate-400 dark:text-slate-500 truncate"}>
          {selected ? getLabel(selected) : placeholder}
        </span>
        <ChevronDown size={16} className="text-slate-400 dark:text-slate-500 shrink-0" />
      </button>

      {disabled && disabledMessage && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{disabledMessage}</p>
      )}

      {open && !disabled && (
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

function DateSelectGroup({ label, day, month, year, onDayChange, onMonthChange, onYearChange, disabled }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">{label}</label>
      <div className="grid grid-cols-3 gap-2">
        <select
          value={day}
          disabled={disabled}
          onChange={(e) => onDayChange(parseInt(e.target.value, 10))}
          className="w-full px-2 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm outline-none transition-colors text-slate-800 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <option value="">اليوم</option>
          {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select
          value={month}
          disabled={disabled}
          onChange={(e) => onMonthChange(parseInt(e.target.value, 10))}
          className="w-full px-2 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm outline-none transition-colors text-slate-800 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <option value="">الشهر</option>
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <select
          value={year}
          disabled={disabled}
          onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
          className="w-full px-2 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm outline-none transition-colors text-slate-800 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <option value="">السنة</option>
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    </div>
  );
}

export default function InvoicesFilter({ isFiltered, resultCount, onFilter, onClearFilter, onCreated, onToast }) {
  const [contractors, setContractors] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [deals, setDeals] = useState([]);

  const [contractorId, setContractorId] = useState("");
  const [authorityId, setAuthorityId] = useState("");
  const [dealId, setDealId] = useState("");

  const [startDay, setStartDay] = useState(firstDayOfMonth.day);
  const [startMonth, setStartMonth] = useState(firstDayOfMonth.month);
  const [startYear, setStartYear] = useState(firstDayOfMonth.year);

  const [endDay, setEndDay] = useState(todayDate.day);
  const [endMonth, setEndMonth] = useState(todayDate.month);
  const [endYear, setEndYear] = useState(todayDate.year);

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getFilterOptions().then((res) => {
      setContractors(res.contractors || []);
      setAuthorities(res.authorities || []);
    });
  }, []);

  useEffect(() => {
    if (contractorId && authorityId) {
      getDealsByContractorAndAuthority(contractorId, authorityId).then((rows) => setDeals(rows || []));
    }
  }, [contractorId, authorityId]);

  const handleContractorChange = (id) => {
    setContractorId(id);
    setAuthorityId("");
    setDealId("");
    setDeals([]);
    setError("");
  };

  const handleAuthorityChange = (id) => {
    setAuthorityId(id);
    setDealId("");
    setDeals([]);
    setError("");
  };

  const handleDealChange = (id) => {
    setDealId(id);
    setError("");
  };

  const hasSelection = Boolean(contractorId || authorityId || dealId);
  const dateReady = Boolean(startDay && startMonth && startYear && endDay && endMonth && endYear);
  const canCreate = Boolean(dealId) && dateReady;

  const handleFilter = () => {
    if (!hasSelection) return;
    onFilter?.({
      contractor_id: contractorId || undefined,
      authority_id: authorityId || undefined,
      deal_id: dealId || undefined,
    });
  };

  const handleClear = () => {
    setContractorId("");
    setAuthorityId("");
    setDealId("");
    onClearFilter?.();
  };

  const handleCreate = async () => {
    setError("");
    if (!canCreate) return;

    const startDate = `${startYear}-${pad(startMonth)}-${pad(startDay)}`;
    const endDate = `${endYear}-${pad(endMonth)}-${pad(endDay)}`;

    if (startDate > endDate) {
      setError("يجب أن يكون تاريخ البداية قبل تاريخ النهاية");
      return;
    }

    setCreating(true);
    try {
      const invoice = await create({
        deal_id: dealId,
        contractor_id: contractorId,
        authority_id: authorityId,
        start_date: startDate,
        end_date: endDate,
      });
      onToast?.("تم إنشاء الفاتورة بنجاح");
      onCreated?.(invoice);
    } catch (err) {
      const message = err.arabicMessage || err?.response?.data?.error || "حدث خطأ أثناء إنشاء الفاتورة";
      setError(message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 transition-all duration-300 space-y-4">
      <div className="flex items-center gap-2">
        <Filter size={16} className="text-slate-500 dark:text-slate-400" />
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">فلترة الفواتير وإنشاء فاتورة جديدة</h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">المتعامل المتعاقد</label>
          <FilterSearchableSelect
            value={contractorId}
            options={contractors}
            getLabel={(c) => `${c.designation}${c.full_name ? " - " + c.full_name : ""}`}
            placeholder="اختر المتعامل"
            onChange={handleContractorChange}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">المصلحة المتعاقدة</label>
          <FilterSearchableSelect
            value={authorityId}
            options={authorities}
            getLabel={(a) => a.name}
            placeholder="اختر المصلحة"
            onChange={handleAuthorityChange}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">الصفقة</label>
          <FilterSearchableSelect
            value={dealId}
            options={deals}
            getLabel={(d) => d.reference}
            placeholder="اختر الصفقة"
            disabled={!(contractorId && authorityId)}
            disabledMessage="حدد المتعامل والمصلحة أولاً"
            onChange={handleDealChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DateSelectGroup
          label="تاريخ البداية"
          day={startDay}
          month={startMonth}
          year={startYear}
          onDayChange={setStartDay}
          onMonthChange={setStartMonth}
          onYearChange={setStartYear}
          disabled={!dealId}
        />
        <DateSelectGroup
          label="تاريخ النهاية"
          day={endDay}
          month={endMonth}
          year={endYear}
          onDayChange={setEndDay}
          onMonthChange={setEndMonth}
          onYearChange={setEndYear}
          disabled={!dealId}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2.5 border border-red-100 dark:border-red-500/30">
          {error}
        </p>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <button
          type="button"
          onClick={handleCreate}
          disabled={!canCreate || creating}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          {creating ? "جارٍ الإنشاء..." : "إنشاء فاتورة"}
        </button>

        <button
          type="button"
          onClick={handleFilter}
          disabled={!hasSelection}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Search size={16} />
          فلترة
        </button>

        {isFiltered && (
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 text-sm font-medium bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <X size={16} />
            إلغاء الفلترة
          </button>
        )}
      </div>

      {isFiltered && (
        <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-medium">
          <Filter size={14} />
          <span>الفلترة نشطة - يتم عرض {resultCount} فاتورة</span>
        </div>
      )}
    </div>
  );
}
