"use client";
import { useState } from "react";
import RawMaterialsPage from "@/components/raw-materials/RawMaterialsPage";
import ContractingAuthorityPage from "@/components/contracting-authority/ContractingAuthorityPage";
import AuthorityBranchesPage from "@/components/authority-branches/AuthorityBranchesPage";
import ContractorPage from "@/components/contractor/ContractorPage";
import DealsPage from "@/components/deals/DealsPage";
import ThemeToggle from "@/components/layout/ThemeToggle";
import {
  Package,
  Building2,
  GitBranch,
  UserCheck,
  Handshake,
  FileText,
  Receipt,
  Users,
  Database,
  Plus,
  List,
  Search,
  Edit,
  Trash2,
  Download,
  Mail,
  Settings,
  BarChart3,
  Menu,
  X,
  ChevronLeft,
  LogOut,
  Home,
} from "lucide-react";

const sections = [
  {
    id: "raw-materials",
    label: "المواد الأولية",
    icon: Package,
    color: "#2D7A4F",
    services: [
      { id: "list", label: "قائمة المواد", icon: List },
      { id: "add", label: "إضافة مادة", icon: Plus },
      { id: "search", label: "بحث", icon: Search },
    ],
  },
  {
    id: "contracting-authority",
    label: "المصلحة المتعاقدة",
    icon: Building2,
    color: "#1A5276",
    services: [
      { id: "list", label: "قائمة المصالح", icon: List },
      { id: "add", label: "إضافة مصلحة", icon: Plus },
      { id: "edit", label: "تعديل", icon: Edit },
    ],
  },
  {
    id: "authority-branches",
    label: "فروع المصلحة",
    icon: GitBranch,
    color: "#6C3483",
    services: [
      { id: "list", label: "قائمة الفروع", icon: List },
      { id: "add", label: "إضافة فرع", icon: Plus },
      { id: "edit", label: "تعديل", icon: Edit },
    ],
  },
  {
    id: "contractor",
    label: "المتعامل المتعاقد",
    icon: UserCheck,
    color: "#B9770E",
    services: [
      { id: "list", label: "بيانات المتعامل", icon: List },
      { id: "edit", label: "تعديل البيانات", icon: Edit },
    ],
  },
  {
    id: "deals",
    label: "الصفقات",
    icon: Handshake,
    color: "#1E8449",
    services: [
      { id: "list", label: "كل الصفقات", icon: List },
      { id: "add", label: "إضافة صفقة", icon: Plus },
      { id: "search", label: "بحث", icon: Search },
      { id: "stats", label: "إحصائيات", icon: BarChart3 },
    ],
  },
  {
    id: "receipts",
    label: "الوصولات",
    icon: FileText,
    color: "#2471A3",
    services: [
      { id: "list", label: "كل الوصولات", icon: List },
      { id: "add", label: "إنشاء وصل", icon: Plus },
      { id: "search", label: "بحث", icon: Search },
    ],
  },
  {
    id: "invoices",
    label: "الفواتير",
    icon: Receipt,
    color: "#A93226",
    services: [
      { id: "list", label: "كل الفواتير", icon: List },
      { id: "add", label: "إنشاء فاتورة", icon: Plus },
      { id: "search", label: "بحث", icon: Search },
    ],
  },
  {
    id: "users",
    label: "المستخدمين",
    icon: Users,
    color: "#7D3C98",
    services: [
      { id: "list", label: "قائمة المستخدمين", icon: List },
      { id: "add", label: "إضافة مستخدم", icon: Plus },
      { id: "settings", label: "الصلاحيات", icon: Settings },
    ],
  },
  {
    id: "database-backup",
    label: "حفظ قاعدة المعطيات",
    icon: Database,
    color: "#1A5276",
    services: [
      { id: "backup", label: "إنشاء نسخة", icon: Download },
      { id: "send", label: "إرسال عبر الإيميل", icon: Mail },
      { id: "list", label: "النسخ السابقة", icon: List },
    ],
  },
];

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState("raw-materials");
  const [activeService, setActiveService] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentSection = sections.find((s) => s.id === activeSection);

  const handleSectionClick = (sectionId) => {
    setActiveSection(sectionId);
    setActiveService(null);
    setSidebarOpen(false);
  };

  return (
    <div
      dir="rtl"
      className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden"
      style={{ fontFamily: "'Tajawal', 'Segoe UI', sans-serif" }}
    >
      {/* ── Header ── */}
      <header className="h-14 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 lg:px-6 shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#1A5276" }}
            >
              <Handshake size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                منصة تسيير الصفقات
              </h1>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                إدارة الموارد والتوريدات
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            المدير العام
          </span>
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
            <Users size={14} className="text-slate-500 dark:text-slate-400" />
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* ── Services Bar (Top) ── */}
      {currentSection && (
        <div
          className="shrink-0 border-b bg-white dark:bg-slate-800 dark:border-slate-700 px-4 lg:px-6 py-2.5 z-20"
          style={{ borderBottomColor: currentSection.color + "30" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <currentSection.icon
              size={16}
              style={{ color: currentSection.color }}
            />
            <span
              className="text-xs font-bold"
              style={{ color: currentSection.color }}
            >
              {currentSection.label}
            </span>
            <ChevronLeft size={14} className="text-slate-300 dark:text-slate-600" />
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {activeService
                ? currentSection.services.find((s) => s.id === activeService)
                    ?.label
                : "اختر خدمة"}
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {currentSection.services.map((service) => {
              const isActive = activeService === service.id;
              return (
                <button
                  key={service.id}
                  onClick={() => setActiveService(service.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? "text-white shadow-sm"
                      : "bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600"
                  }`}
                  style={
                    isActive
                      ? { backgroundColor: currentSection.color }
                      : {}
                  }
                >
                  <service.icon size={15} />
                  {service.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 dark:bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar (Right) ── */}
        <aside
          className={`
            fixed top-14 right-0 bottom-0 w-56 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 z-40
            transform transition-transform duration-300 ease-in-out
            lg:static lg:translate-x-0 lg:z-10 lg:shrink-0
            ${sidebarOpen ? "translate-x-0" : "translate-x-full"}
          `}
        >
          <div className="h-full overflow-y-auto py-3 px-2">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium px-3 mb-2">
              أقسام المنصة
            </p>
            <nav className="space-y-0.5">
              {sections.map((section) => {
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => handleSectionClick(section.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                      isActive
                        ? "font-bold text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium"
                    }`}
                    style={
                      isActive ? { backgroundColor: section.color } : {}
                    }
                  >
                    <section.icon
                      size={18}
                      className={isActive ? "text-white/90" : ""}
                      style={!isActive ? { color: section.color } : {}}
                    />
                    <span className="truncate">{section.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Sidebar Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 px-2">
              <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                <LogOut size={16} />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {activeSection === "raw-materials" ? (
            <RawMaterialsPage
              activeService={activeService}
              onServiceChange={setActiveService}
            />
          ) : activeSection === "contracting-authority" ? (
            <ContractingAuthorityPage
              activeService={activeService}
              onServiceChange={setActiveService}
            />
          ) : activeSection === "authority-branches" ? (
            <AuthorityBranchesPage
              activeService={activeService}
              onServiceChange={setActiveService}
            />
          ) : activeSection === "contractor" ? (
            <ContractorPage
              activeService={activeService}
              onServiceChange={setActiveService}
            />
          ) : activeSection === "deals" ? (
            <DealsPage
              activeService={activeService}
              onServiceChange={setActiveService}
            />
          ) : !activeService ? (
            /* Welcome / Section Overview */
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5 shadow-sm"
                style={{
                  backgroundColor: currentSection.color + "12",
                }}
              >
                <currentSection.icon
                  size={36}
                  style={{ color: currentSection.color }}
                />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                {currentSection.label}
              </h2>
              <p className="text-sm text-slate-400 dark:text-slate-500 mb-6 leading-relaxed">
                اختر إحدى الخدمات من الشريط العلوي للبدء في استخدام هذا القسم
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
                {currentSection.services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => setActiveService(service.id)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm dark:hover:shadow-slate-900 transition-all duration-200 group"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                      style={{
                        backgroundColor: currentSection.color + "12",
                      }}
                    >
                      <service.icon
                        size={18}
                        style={{ color: currentSection.color }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      {service.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Active Service Content Area */
            <div>
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900">
                {/* Service Header */}
                <div className="p-4 lg:p-5 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      {currentSection.services.find(
                        (s) => s.id === activeService
                      )?.label || ""}
                    </h3>

                    {activeService === "add" && (
                      <button
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium shadow-sm hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: currentSection.color }}
                      >
                        <Plus size={16} />
                        إضافة جديد
                      </button>
                    )}

                    {activeService === "search" && (
                      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 rounded-lg px-3 py-2 flex-1 sm:max-w-xs">
                        <Search size={16} className="text-slate-400 dark:text-slate-500" />
                        <input
                          type="text"
                          placeholder="ابحث هنا..."
                          className="bg-transparent text-sm w-full outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-500"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Service Content Placeholder */}
                <div className="p-6 lg:p-10 flex flex-col items-center justify-center text-center min-h-[300px]">
                  <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center mb-4">
                    {(() => {
                      const srv = currentSection.services.find(
                        (s) => s.id === activeService
                      );
                      return srv ? (
                        <srv.icon size={24} className="text-slate-300 dark:text-slate-600" />
                      ) : null;
                    })()}
                  </div>
                  <p className="text-slate-400 dark:text-slate-500 text-sm mb-1">
                    منطقة المحتوى
                  </p>
                  <p className="text-slate-300 dark:text-slate-600 text-xs">
                    سيتم عرض{" "}
                    {currentSection.services.find(
                      (s) => s.id === activeService
                    )?.label || ""}{" "}
                    هنا بعد ربط قاعدة البيانات
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
