"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  ChevronDown,
  Package,
  Handshake,
  FileText,
  Receipt,
  Users,
  HelpCircle,
} from "lucide-react";

const ICONS = { Package, Handshake, FileText, Receipt, Users, HelpCircle };

const faqData = [
  {
    category: "المواد الأولية",
    icon: "Package",
    color: "#2D7A4F",
    questions: [
      {
        q: "كيف أضيف مادة أولية جديدة؟",
        a: "ادخل لقسم المواد الأولية من القائمة الجانبية، ثم اضغط على زر 'إضافة مادة جديدة'، أدخل اسم المادة بالعربي (إجباري) واللاتيني (اختياري) مع تحديد الوحدة والوصف والصورة إن وجدت.",
      },
      {
        q: "هل يمكن حذف مادة أولية مستخدمة في صفقة؟",
        a: "لا، لا يمكن حذف أي مادة أولية مرتبطة بصفقة أو وصل تسليم. يجب أولاً إزالتها من جميع الصفقات والوصولات قبل حذفها.",
      },
      {
        q: "ما هي أصناف المواد الأولية؟",
        a: "الأصناف هي تصنيفات تُستخدم لتنظيم المواد الأولية عند إنشاء الصفقات. يمكن إضافة أصناف جديدة من زر 'أصناف المواد الأولية' داخل قسم المواد الأولية.",
      },
    ],
  },
  {
    category: "الصفقات",
    icon: "Handshake",
    color: "#1E8449",
    questions: [
      {
        q: "كيف أنشئ صفقة جديدة؟",
        a: "ادخل لقسم الصفقات، اضغط 'إضافة صفقة جديدة'، حدد المتعامل المتعاقد والمصلحة المتعاقدة وتاريخ البداية والنهاية. بعد إنشاء الصفقة يمكنك إضافة فروع المصلحة المستفيدة والمواد الأولية.",
      },
      {
        q: "كيف أضيف مواد أولية للصفقة؟",
        a: "ادخل للصفقة بالضغط على أيقونة العين أو بالنقر مرتين عليها، ستجد قسم 'المواد الأولية للصفقة' حيث يمكنك إضافة المواد مع تحديد الكمية الدنيا والقصوى والسعر الوحدوي ونسبة TVA.",
      },
      {
        q: "ما الفرق بين الكمية الدنيا والقصوى في الصفقة؟",
        a: "الكمية القصوى هي الحد الأقصى للكمية التي يمكن توريدها للمادة طوال فترة الصفقة. الكمية الدنيا هي الحد الأدنى. عند إنشاء الوصولات يتم إنقاص الكميات الموزعة من الكمية القصوى.",
      },
      {
        q: "كيف أطلع على إحصائيات الصفقة؟",
        a: "ادخل لقسم الصفقات واضغط على أيقونة الإحصائيات (BarChart) في صف الصفقة، ستظهر لك القيمة الإجمالية بالكميات الدنيا والقصوى مع وبدون رسوم TVA مع إمكانية تحميل ملف Excel.",
      },
      {
        q: "هل يمكن حذف صفقة تحتوي على وصولات أو فواتير؟",
        a: "لا، لا يمكن حذف أي صفقة مرتبطة بوصولات أو فواتير أو مواد أولية. يجب حذف جميع العناصر المرتبطة بها أولاً.",
      },
    ],
  },
  {
    category: "الوصولات",
    icon: "FileText",
    color: "#2471A3",
    questions: [
      {
        q: "كيف أنشئ وصل تسليم جديد؟",
        a: "ادخل لقسم الوصولات، اضغط 'إنشاء وصل جديد'، حدد المتعامل المتعاقد ثم المصلحة المتعاقدة ثم الصفقة ثم فرع المصلحة. سيتم إنشاء رمز الوصل تلقائياً على شكل (اسم الصفقة-رقم تسلسلي).",
      },
      {
        q: "كيف أضيف مواد للوصل؟",
        a: "بعد إنشاء الوصل ادخل إليه بالضغط على أيقونة العين، ستجد نموذج إضافة المواد. اختر المادة من القائمة المنسدلة وأدخل الكمية المراد توزيعها. لا يمكن تجاوز الكمية المتبقية في الصفقة.",
      },
      {
        q: "ماذا يحدث للكميات عند إضافة مادة للوصل؟",
        a: "يتم إنقاص الكمية المضافة في الوصل من الكمية القصوى المتبقية للمادة في الصفقة تلقائياً. عند حذف المادة من الوصل تُستعاد الكمية تلقائياً.",
      },
      {
        q: "كيف أطلع على الكمية المتبقية لمادة في الصفقة؟",
        a: "عند إضافة مادة للوصل تظهر الكمية المتبقية تلقائياً. كما يمكنك الاطلاع عليها بالنقر مرتين على المادة داخل الصفقة حيث تظهر الكمية الابتدائية والمستهلكة والمتبقية.",
      },
      {
        q: "كيف أحمّل وصل التسليم كملف Excel؟",
        a: "ادخل للوصل، اختر اللغة (عربي/فرنسي) من القائمة المنسدلة بجانب زر 'تحميل Excel'، ثم اضغط الزر. سيتم تحميل الوصل بتنسيق القالب المحدد مسبقاً.",
      },
      {
        q: "كيف أفلتر الوصولات؟",
        a: "اضغط على زر 'فلترة' في قسم الوصولات، حدد المتعامل والمصلحة والصفقة والفرع، ثم اضغط 'فلترة'. يمكنك أيضاً تحميل ملف Excel تراكمي لجميع الوصولات في فترة زمنية محددة.",
      },
      {
        q: "هل يمكن لأي مستخدم تعديل وصل أنشأه مستخدم آخر؟",
        a: "لا، كل مستخدم يمكنه فقط تعديل وحذف الوصولات التي أنشأها بنفسه. المدير الرئيسي فقط يمكنه التعديل على جميع الوصولات.",
      },
    ],
  },
  {
    category: "الفواتير",
    icon: "Receipt",
    color: "#A93226",
    questions: [
      {
        q: "كيف أنشئ فاتورة جديدة؟",
        a: "ادخل لقسم الفواتير، في قسم الفلترة حدد المتعامل والمصلحة والصفقة وتاريخ البداية والنهاية، ثم اضغط 'إنشاء فاتورة'. سيتم جمع جميع المواد الموزعة في تلك الفترة من جميع الفروع تلقائياً.",
      },
      {
        q: "لماذا لا تظهر المواد المضافة حديثاً في فاتورة قديمة؟",
        a: "الفاتورة وثيقة محاسبية قانونية ثابتة تعكس حالة المواد في وقت إنشائها فقط. أي مواد مضافة بعد إنشاء الفاتورة تُدرج في فاتورة جديدة للفترة الزمنية المناسبة.",
      },
      {
        q: "ما هو رقم الفاتورة؟",
        a: "رقم الفاتورة يتكون من مرجع الصفقة متبوعاً بحرف F ورقم تسلسلي. مثال: صفقة-2024-001-F1، صفقة-2024-001-F2...",
      },
      {
        q: "كيف أحمّل الفاتورة كملف Excel؟",
        a: "ادخل للفاتورة، اختر اللغة (عربي/فرنسي)، ثم اضغط 'تحميل Excel'. سيتم تحميل الفاتورة بالقالب المحدد مع جميع الحسابات (EXO, TVA 9%, TVA 19%, TOTAL HT, TOTAL TTC).",
      },
    ],
  },
  {
    category: "المستخدمين والصلاحيات",
    icon: "Users",
    color: "#7D3C98",
    questions: [
      {
        q: "ما الفرق بين المدير الرئيسي والمستخدم الثانوي؟",
        a: "المدير الرئيسي لديه جميع الصلاحيات بدون قيود. المستخدم الثانوي يُنشئ حسابه المدير الرئيسي ويحدد له الصلاحيات المناسبة لعمله (إنشاء صفقات، وصولات، فواتير...).",
      },
      {
        q: "كيف أضيف مستخدماً جديداً؟",
        a: "ادخل لقسم المستخدمين (المدير فقط)، اضغط 'إضافة مستخدم جديد'، أدخل البيانات وحدد نوع المستخدم والصلاحيات، ثم احفظ. سيتمكن المستخدم من الدخول باسم المستخدم وكلمة السر المحددة.",
      },
      {
        q: "كيف أعيد تعيين كلمة سر مستخدم؟",
        a: "ادخل لقسم المستخدمين، اضغط على زر إعادة تعيين كلمة السر (البرتقالي) بجانب المستخدم المعني، أدخل كلمة السر الجديدة وأكدها.",
      },
      {
        q: "هل يمكن تعطيل حساب مستخدم بدون حذفه؟",
        a: "نعم، عند تعديل بيانات المستخدم يمكن تغيير حالة الحساب من 'نشط' إلى 'معطل'. المستخدم المعطل لا يمكنه الدخول للمنصة.",
      },
    ],
  },
  {
    category: "عام",
    icon: "HelpCircle",
    color: "#1A5276",
    questions: [
      {
        q: "كيف أتنقل بين الأقسام؟",
        a: "استخدم القائمة الجانبية على اليمين للتنقل بين الأقسام. عند اختيار قسم تظهر خدماته في الشريط العلوي.",
      },
      {
        q: "كيف أفعّل الوضع المظلم؟",
        a: "اضغط على أيقونة القمر/الشمس في الزاوية العلوية اليسرى للتبديل بين الوضع المظلم والفاتح. يتم حفظ تفضيلك تلقائياً.",
      },
      {
        q: "هل يمكن استخدام المنصة على الهاتف؟",
        a: "نعم، المنصة متجاوبة مع جميع أحجام الشاشات. على الهاتف تظهر القائمة الجانبية عند الضغط على أيقونة القائمة في الزاوية العلوية.",
      },
      {
        q: "ما هي اختصارات لوحة المفاتيح المتاحة؟",
        a: "في قسم الصفقات: النقر مرتين أو Enter أو Ctrl+F1 للدخول للصفقة. في الوصولات والصفقات: النقر مرتين على أي مادة لتعديلها مباشرة.",
      },
    ],
  },
];

function QuestionAccordion({ item, isOpen, onToggle }) {
  return (
    <div className="border-b border-slate-100 dark:border-slate-700 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 text-right hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
      >
        <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{item.q}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-400 dark:text-slate-500 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <p className="px-4 sm:px-5 pb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {item.a}
          </p>
        </div>
      </div>
    </div>
  );
}

function CategoryCard({ category, isOpen, onToggleCategory, openQuestions, onToggleQuestion }) {
  const Icon = ICONS[category.icon] || HelpCircle;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onToggleCategory}
        className="w-full flex items-center justify-between gap-3 p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: category.color + "18" }}
          >
            <Icon size={18} style={{ color: category.color }} />
          </div>
          <div className="text-right">
            <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
              {category.category}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-tight mt-0.5">
              {category.questions.length} سؤال
            </p>
          </div>
        </div>
        <ChevronDown
          size={18}
          className={`shrink-0 text-slate-400 dark:text-slate-500 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-slate-100 dark:border-slate-700">
            {category.questions.map((item, index) => {
              const key = `${category.category}-${index}`;
              return (
                <QuestionAccordion
                  key={key}
                  item={item}
                  isOpen={openQuestions.has(key)}
                  onToggle={() => onToggleQuestion(key)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FAQPage({ activeService, onServiceChange }) {
  const [search, setSearch] = useState("");
  const [openCategories, setOpenCategories] = useState(() => new Set([faqData[0].category]));
  const [openQuestions, setOpenQuestions] = useState(() => new Set());
  const searchRef = useRef(null);

  useEffect(() => {
    if (activeService === "search") {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [activeService]);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return faqData;
    return faqData
      .map((category) => ({
        ...category,
        questions: category.questions.filter(
          (item) => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
        ),
      }))
      .filter((category) => category.questions.length > 0);
  }, [search]);

  const isSearching = Boolean(search.trim());

  const toggleCategory = (categoryName) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryName)) next.delete(categoryName);
      else next.add(categoryName);
      return next;
    });
  };

  const toggleQuestion = (key) => {
    setOpenQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const totalQuestions = faqData.reduce((sum, c) => sum + c.questions.length, 0);
  const matchedQuestions = filteredData.reduce((sum, c) => sum + c.questions.length, 0);

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#1A5276" + "18" }}
          >
            <HelpCircle size={18} style={{ color: "#1A5276" }} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
              الأسئلة الشائعة
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-tight">
              دليل استخدام منصة تسيير الصفقات
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 rounded-lg px-3 py-2.5 w-full sm:max-w-sm">
          <Search size={15} className="text-slate-400 dark:text-slate-500 shrink-0" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث في الأسئلة..."
            className="bg-transparent text-sm w-full outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
        {search.trim() && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            {matchedQuestions} نتيجة من أصل {totalQuestions} سؤال
          </p>
        )}
      </div>

      {/* Categories */}
      {filteredData.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center mb-4">
              <Search size={22} className="text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              لا توجد أسئلة تطابق بحثك
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredData.map((category) => (
            <CategoryCard
              key={category.category}
              category={category}
              isOpen={isSearching || openCategories.has(category.category)}
              onToggleCategory={() => toggleCategory(category.category)}
              openQuestions={openQuestions}
              onToggleQuestion={toggleQuestion}
            />
          ))}
        </div>
      )}
    </div>
  );
}
