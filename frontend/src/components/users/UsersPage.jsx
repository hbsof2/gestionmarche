"use client";
import { useState, useEffect, useMemo } from "react";
import { Plus, Users as UsersIcon, ShieldAlert, Activity, BarChart3 } from "lucide-react";
import UsersList from "./UsersList";
import UserForm from "./UserForm";
import ResetPasswordModal from "./ResetPasswordModal";
import UserDeleteModal from "./UserDeleteModal";
import ActivityLogsPage from "./ActivityLogsPage";
import UsersStatsPage from "./UsersStatsPage";
import { getAll, create, update, resetPassword, remove } from "@/services/usersService";
import { getUser } from "@/lib/auth";

const COLOR = "#7D3C98";

export default function UsersPage({ activeService, onServiceChange }) {
  const currentUser = getUser();
  const isAdmin = currentUser?.role === "admin";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const [showActivityLogs, setShowActivityLogs] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const rows = await getAll();
      setUsers(rows);
    } catch {
      showToast("حدث خطأ أثناء تحميل البيانات", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  useEffect(() => {
    if (activeService === "add" && isAdmin) {
      setEditUser(null);
      setFormOpen(true);
    }
  }, [activeService, isAdmin]);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.trim().toLowerCase();
    return users.filter(
      (u) => u.full_name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)
    );
  }, [users, search]);

  const handleEdit = (user) => {
    setEditUser(user);
    setFormOpen(true);
  };

  const handleFormSave = async (data, id) => {
    try {
      if (id) {
        await update(id, data);
        showToast("تم تحديث المستخدم بنجاح");
      } else {
        await create(data);
        showToast("تمت إضافة المستخدم بنجاح");
      }
      setFormOpen(false);
      setEditUser(null);
      onServiceChange?.("list");
      fetchUsers();
    } catch (err) {
      throw err;
    }
  };

  const handleFormCancel = () => {
    setFormOpen(false);
    setEditUser(null);
    onServiceChange?.("list");
  };

  const handleResetPasswordConfirm = async (newPassword) => {
    await resetPassword(resetTarget.id, newPassword);
    showToast("تم تغيير كلمة السر بنجاح");
    setResetTarget(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await remove(deleteTarget.id);
    showToast("تم حذف المستخدم بنجاح");
    setDeleteTarget(null);
    fetchUsers();
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-4">
          <ShieldAlert size={24} className="text-red-500" />
        </div>
        <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">
          هذه الصفحة متاحة للمدير الرئيسي فقط
        </p>
      </div>
    );
  }

  if (showStats) {
    return <UsersStatsPage onBack={() => setShowStats(false)} />;
  }

  if (showActivityLogs) {
    return <ActivityLogsPage onBack={() => setShowActivityLogs(false)} />;
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: COLOR + "18" }}
          >
            <UsersIcon size={18} style={{ color: COLOR }} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">إدارة المستخدمين</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-tight">
              {users.length > 0 ? `${users.length} مستخدم مسجل` : "إدارة حسابات المستخدمين"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowStats(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400 transition-colors shrink-0 hover:bg-purple-50 dark:hover:bg-purple-500/10"
          >
            <BarChart3 size={16} />
            إحصائيات
          </button>
          <button
            onClick={() => setShowActivityLogs(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors shrink-0 hover:bg-slate-50 dark:hover:bg-slate-700"
            style={{ borderColor: COLOR, color: COLOR }}
          >
            <Activity size={16} />
            سجل العمليات
          </button>
          <button
            onClick={() => { setEditUser(null); setFormOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium shadow-sm hover:opacity-90 transition-opacity shrink-0"
            style={{ backgroundColor: COLOR }}
          >
            <Plus size={16} />
            إضافة مستخدم جديد
          </button>
        </div>
      </div>

      {/* List */}
      <UsersList
        users={filteredUsers}
        loading={loading}
        search={search}
        onSearch={setSearch}
        onEdit={handleEdit}
        onResetPassword={setResetTarget}
        onDelete={setDeleteTarget}
        activeService={activeService}
      />

      {/* Form Modal */}
      {formOpen && (
        <UserForm
          user={editUser}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
        />
      )}

      {/* Reset Password Modal */}
      {resetTarget && (
        <ResetPasswordModal
          user={resetTarget}
          onConfirm={handleResetPasswordConfirm}
          onCancel={() => setResetTarget(null)}
        />
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <UserDeleteModal
          user={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all duration-300 whitespace-nowrap ${
            toast.type === "error" ? "bg-red-500" : "bg-green-600"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
