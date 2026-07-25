"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { Filter, Search, X, ChevronDown } from "lucide-react";
import {
  getFilterOptions,
  getDealsByContractorAndAuthority,
  getDealBranchesForReceipt,
} from "@/services/receiptsService";

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

export default function ReceiptsFilter({ isFiltered, resultCount, onFilter, onClearFilter }) {
  const [contractors, setContractors] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [deals, setDeals] = useState([]);
  const [branches, setBranches] = useState([]);

  const [contractorId, setContractorId] = useState("");
  const [authorityId, setAuthorityId] = useState("");
  const [dealId, setDealId] = useState("");
  const [branchId, setBranchId] = useState("");

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

  useEffect(() => {
    if (dealId) {
      getDealBranchesForReceipt(dealId).then((rows) => setBranches(rows || []));
    }
  }, [dealId]);

  const handleContractorChange = (id) => {
    setContractorId(id);
    setAuthorityId("");
    setDealId("");
    setBranchId("");
    setDeals([]);
    setBranches([]);
  };

  const handleAuthorityChange = (id) => {
    setAuthorityId(id);
    setDealId("");
    setBranchId("");
    setDeals([]);
    setBranches([]);
  };

  const handleDealChange = (id) => {
    setDealId(id);
    setBranchId("");
    setBranches([]);
  };

  const hasSelection = Boolean(contractorId || authorityId || dealId || branchId);

  const handleFilter = () => {
    if (!hasSelection) return;
    onFilter?.({
      contractor_id: contractorId || undefined,
      authority_id: authorityId || undefined,
      deal_id: dealId || undefined,
      branch_id: branchId || undefined,
    });
  };

  const handleClear = () => {
    setContractorId("");
    setAuthorityId("");
    setDealId("");
    setBranchId("");
    onClearFilter?.();
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 transition-all duration-300 space-y-4">
      <div className="flex items-center gap-2">
        <Filter size={16} className="text-slate-500 dark:text-slate-400" />
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">فلترة الوصولات</h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">المتعامل المتعاقد</label>
          <FilterSearchableSelect
            value={contractorId}
            options={contractors}
            getLabel={(c) => `${c.designation}${c.full_name ? " - " + c.full_name : ""}`}
            placeholder="كل المتعاملين"
            onChange={handleContractorChange}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">المصلحة المتعاقدة</label>
          <FilterSearchableSelect
            value={authorityId}
            options={authorities}
            getLabel={(a) => a.name}
            placeholder="كل المصالح"
            onChange={handleAuthorityChange}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">الصفقة</label>
          <FilterSearchableSelect
            value={dealId}
            options={deals}
            getLabel={(d) => d.reference}
            placeholder="كل الصفقات"
            disabled={!(contractorId && authorityId)}
            disabledMessage="حدد المتعامل والمصلحة أولاً"
            onChange={handleDealChange}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">فرع المصلحة</label>
          <FilterSearchableSelect
            value={branchId}
            options={branches}
            getLabel={(b) => `${b.name} - ${b.wilaya}`}
            placeholder="كل الفروع"
            disabled={!dealId}
            disabledMessage="حدد الصفقة أولاً"
            onChange={setBranchId}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
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
          <span>الفلترة نشطة - يتم عرض {resultCount} وصل</span>
        </div>
      )}
    </div>
  );
}
