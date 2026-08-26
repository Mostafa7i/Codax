"use client";
import React, { useState, useMemo } from "react";
import "./InstallmentTracker.css";
import GroupCard from "./GroupCard";
import { useInstallmentData } from "./useInstallmentData";

// ── Helpers ────────────────────────────────────────────────
const fmt = (n) =>
  Number(n || 0).toLocaleString("ar-EG", { maximumFractionDigits: 0 });

const GROUP_COLORS = [
  "#6366f1", "#a855f7", "#06b6d4", "#10b981",
  "#f59e0b", "#ef4444", "#ec4899", "#14b8a6",
];

// ── Toast system ───────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = (msg, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  };
  return { toasts, show };
}

const ICONS = { success: "✅", error: "❌", info: "ℹ️" };

// ── Add Group Modal ────────────────────────────────────────
function AddGroupModal({ onClose, onAdd }) {
  const [name, setName]   = useState("");
  const [color, setColor] = useState(GROUP_COLORS[0]);

  const submit = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), color });
    onClose();
  };

  return (
    <div className="it-overlay" onClick={onClose}>
      <div className="it-modal" onClick={(e) => e.stopPropagation()}>
        <div className="it-modal__header">
          <h2 className="it-modal__title">➕ إضافة مجموعة جديدة</h2>
          <button className="it-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="it-modal__body">
          <div className="it-field">
            <label>اسم المجموعة</label>
            <input
              autoFocus
              className="it-input"
              placeholder="مثال: مجموعة الأولى"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
          <div className="it-field">
            <label>لون المجموعة</label>
            <div className="it-color-options">
              {GROUP_COLORS.map((c) => (
                <div
                  key={c}
                  className={`it-color-opt ${color === c ? "active" : ""}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="it-modal__footer">
          <button className="it-btn it-btn--outline" onClick={onClose}>إلغاء</button>
          <button className="it-btn it-btn--primary" onClick={submit} disabled={!name.trim()}>
            إضافة المجموعة
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Student Modal ──────────────────────────────────────
function AddStudentModal({ groupId, onClose, onAdd }) {
  const [form, setForm] = useState({
    name: "",
    referral: "",
    phone: "",
    priceFrontend: "",
    priceBackend: "",
    installment1: "",
    date1: "",
    installment2: "",
    date2: "",
    installment3: "",
    date3: "",
    notes: "",
  });

  const upd = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = () => {
    if (!form.name.trim()) return;
    // تحويل القيم الرقمية
    const cleanForm = {
      ...form,
      priceFrontend: Number(form.priceFrontend) || 0,
      priceBackend: Number(form.priceBackend) || 0,
      installment1: Number(form.installment1) || 0,
      installment2: Number(form.installment2) || 0,
      installment3: Number(form.installment3) || 0,
    };
    onAdd(groupId, cleanForm);
    onClose();
  };

  return (
    <div className="it-overlay" onClick={onClose}>
      <div className="it-modal it-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="it-modal__header">
          <h2 className="it-modal__title">👤 إضافة طالب جديد للمجموعة</h2>
          <button className="it-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="it-modal__body">
          <div className="it-form-grid it-form-grid--3">
            <div className="it-field">
              <label>الاسم *</label>
              <input autoFocus className="it-input" placeholder="اسم الطالب" value={form.name} onChange={upd("name")} />
            </div>
            <div className="it-field">
              <label>الترشيح</label>
              <input className="it-input" placeholder="اسم الشخص المرشِح" value={form.referral} onChange={upd("referral")} />
            </div>
            <div className="it-field">
              <label>رقم الهاتف</label>
              <input className="it-input" placeholder="مثال: 01012345678" value={form.phone} onChange={upd("phone")} />
            </div>
          </div>

          <div className="it-form-grid">
            <div className="it-field">
              <label>سعر الفرونت (ج.م)</label>
              <input type="number" className="it-input" placeholder="0" value={form.priceFrontend} onChange={upd("priceFrontend")} />
            </div>
            <div className="it-field">
              <label>سعر الباك (ج.م)</label>
              <input type="number" className="it-input" placeholder="0" value={form.priceBackend} onChange={upd("priceBackend")} />
            </div>
          </div>

          <div className="it-form-grid it-form-grid--3">
            <div className="it-field">
              <label>القسط الأول (ج.م)</label>
              <input type="number" className="it-input" placeholder="0" value={form.installment1} onChange={upd("installment1")} />
            </div>
            <div className="it-field">
              <label>تاريخ القسط الأول</label>
              <input type="date" className="it-input" value={form.date1} onChange={upd("date1")} />
            </div>
            <div className="it-field">
              <label>ملاحظات</label>
              <input className="it-input" placeholder="أي ملاحظات" value={form.notes} onChange={upd("notes")} />
            </div>
          </div>

          <div className="it-form-grid">
            <div className="it-field">
              <label>القسط الثاني (ج.م)</label>
              <input type="number" className="it-input" placeholder="0" value={form.installment2} onChange={upd("installment2")} />
            </div>
            <div className="it-field">
              <label>تاريخ القسط الثاني</label>
              <input type="date" className="it-input" value={form.date2} onChange={upd("date2")} />
            </div>
          </div>

          <div className="it-form-grid">
            <div className="it-field">
              <label>القسط الثالث (ج.م)</label>
              <input type="number" className="it-input" placeholder="0" value={form.installment3} onChange={upd("installment3")} />
            </div>
            <div className="it-field">
              <label>تاريخ القسط الثالث</label>
              <input type="date" className="it-input" value={form.date3} onChange={upd("date3")} />
            </div>
          </div>
        </div>
        <div className="it-modal__footer">
          <button className="it-btn it-btn--outline" onClick={onClose}>إلغاء</button>
          <button className="it-btn it-btn--primary" onClick={submit} disabled={!form.name.trim()}>
            إضافة الطالب
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Summary Tab ─────────────────────────────────────────────
function SummaryTab({ groups }) {
  const rows = useMemo(() =>
    groups.map((g) => {
      const sts = g.students || [];
      const frontend = sts.reduce((s, x) => s + Number(x.priceFrontend || 0), 0);
      const backend = sts.reduce((s, x) => s + Number(x.priceBackend || 0), 0);
      const price = frontend + backend;
      const collected =
        sts.reduce((s, x) => s + Number(x.installment1 || 0) + Number(x.installment2 || 0) + Number(x.installment3 || 0), 0);
      const remaining = price - collected;
      const pct = price > 0 ? Math.round((collected / price) * 100) : 0;
      return { id: g.id, name: g.name, color: g.color, count: sts.length, frontend, backend, price, collected, remaining, pct };
    }),
  [groups]);

  const grand = useMemo(() => ({
    count:     rows.reduce((s, r) => s + r.count, 0),
    frontend:  rows.reduce((s, r) => s + r.frontend, 0),
    backend:   rows.reduce((s, r) => s + r.backend, 0),
    price:     rows.reduce((s, r) => s + r.price, 0),
    collected: rows.reduce((s, r) => s + r.collected, 0),
    remaining: rows.reduce((s, r) => s + r.remaining, 0),
  }), [rows]);

  return (
    <div className="it-table-wrapper">
      <table className="it-table it-summary-table" style={{ minWidth: 700 }}>
        <thead>
          <tr>
            <th>المجموعة</th>
            <th>عدد الطلاب</th>
            <th>سعر الفرونت</th>
            <th>سعر الباك</th>
            <th>إجمالي السعر المتوقع</th>
            <th>المحصّل</th>
            <th>المتبقي</th>
            <th>نسبة التحصيل</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: r.color, display: "inline-block" }} />
                  {r.name}
                </span>
              </td>
              <td>{r.count}</td>
              <td>{fmt(r.frontend)} ج.م</td>
              <td>{fmt(r.backend)}  ج.م</td>
              <td>{fmt(r.price)} ج.م</td>
              <td style={{ color: "var(--it-green)" }}>{fmt(r.collected)} ج.م</td>
              <td style={{ color: r.remaining > 0 ? "var(--it-red)" : "var(--it-green)" }}>{fmt(r.remaining)} ج.م</td>
              <td>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div className="it-progress" style={{ width: 70 }}>
                    <div
                      className="it-progress__bar"
                      style={{
                        width: `${r.pct}%`,
                        background: r.pct >= 100 ? "var(--it-green)" : r.pct >= 50 ? "var(--it-amber)" : "var(--it-red)",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: ".8rem" }}>{r.pct}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="it-sum-row">
            <td>الإجمالي الكلي</td>
            <td>{grand.count} طالب</td>
            <td>{fmt(grand.frontend)} ج.م</td>
            <td>{fmt(grand.backend)} ج.م</td>
            <td>{fmt(grand.price)} ج.م</td>
            <td style={{ color: "var(--it-green)" }}>{fmt(grand.collected)} ج.م</td>
            <td style={{ color: grand.remaining > 0 ? "var(--it-red)" : "var(--it-green)" }}>{fmt(grand.remaining)} ج.م</td>
            <td>{grand.price > 0 ? Math.round((grand.collected / grand.price) * 100) : 0}%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ── Withdrawal & Vault Tab ──────────────────────────────────
function WithdrawalsTab({ withdrawals, onAdd, onDelete, collectedAmount }) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [date, setDate]     = useState(new Date().toISOString().slice(0, 10));

  const totalWithdrawn = useMemo(() =>
    withdrawals.reduce((sum, w) => sum + (Number(w.amount) || 0), 0)
  , [withdrawals]);

  const vaultBalance = collectedAmount - totalWithdrawn;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !reason.trim()) return;
    onAdd({
      amount: Number(amount),
      reason: reason.trim(),
      date
    });
    setAmount("");
    setReason("");
    setDate(new Date().toISOString().slice(0, 10));
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
      {/* Treasury Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        <div className="it-stat it-stat--green">
          <div className="it-stat__icon">📥</div>
          <div className="it-stat__info">
            <div className="it-stat__label">إجمالي المقبوضات (الكاش المحصل)</div>
            <div className="it-stat__value">{fmt(collectedAmount)} ج.م</div>
          </div>
        </div>
        <div className="it-stat it-stat--red">
          <div className="it-stat__icon">📤</div>
          <div className="it-stat__info">
            <div className="it-stat__label">إجمالي السحوبات</div>
            <div className="it-stat__value">{fmt(totalWithdrawn)}  ج.م</div>
          </div>
        </div>
        <div className="it-stat it-stat--cyan" style={{ border: "1px solid var(--it-primary-h)" }}>
          <div className="it-stat__icon">💰</div>
          <div className="it-stat__info">
            <div className="it-stat__label">صافي الخزنة الحالي</div>
            <div className="it-stat__value" style={{ color: "var(--it-cyan)", fontWeight: 800 }}>{fmt(vaultBalance)} ج.م</div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
        {/* Record form */}
        <div className="it-group" style={{ padding: "20px" }}>
          <h3 style={{ marginBottom: "16px", fontSize: "1rem", fontWeight: "700" }}>💸 تسجيل عملية سحب</h3>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="it-field">
              <label>المبلغ المسحوب *</label>
              <input
                type="number"
                className="it-input"
                placeholder="مثال: 500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="it-field">
              <label>تاريخ السحب</label>
              <input
                type="date"
                className="it-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="it-field">
              <label>السبب / البند *</label>
              <input
                type="text"
                className="it-input"
                placeholder="مثال: رصيد موبايل، شخصي، ملابس..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="it-btn it-btn--primary" style={{ width: "100%", justifyContent: "center" }}>
              💾 حفظ في الخزنة
            </button>
          </form>
        </div>

        {/* Withdrawal Ledger */}
        <div className="it-group" style={{ display: "flex", flexDirection: "column", minHeight: "300px" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--it-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: "700" }}>📝 كشف حركة السحوبات</h3>
            <span className="it-group__badge">{withdrawals.length} حركة سحب</span>
          </div>

          <div className="it-table-wrapper" style={{ flex: 1, maxHeight: "350px", overflowY: "auto" }}>
            <table className="it-table">
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>المبلغ</th>
                  <th>البند / التفاصيل</th>
                  <th>حذف</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "40px 10px", color: "var(--it-muted)" }}>
                      لا توجد عمليات سحب مسجلة في الخزنة
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((w) => (
                    <tr key={w.id}>
                      <td>{w.date}</td>
                      <td style={{ color: "var(--it-red)", fontWeight: "bold" }}>{fmt(w.amount)} ج.م</td>
                      <td>{w.reason}</td>
                      <td>
                        <button
                          className="it-btn it-btn--danger it-btn--xs it-btn--icon"
                          onClick={() => onDelete(w.id)}
                          title="حذف عملية السحب"
                        >
                          🗑
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────
export default function InstallmentTracker() {
  const {
    groups, withdrawals, loading, error, saving, stats,
    addGroup, updateGroup, deleteGroup,
    addStudent, updateStudent, deleteStudent,
    addWithdrawal, deleteWithdrawal
  } = useInstallmentData();

  const { toasts, show } = useToast();

  const [tab, setTab]           = useState("groups");
  const [search, setSearch]     = useState("");
  const [showAddGroup, setShowAddGroup]   = useState(false);
  const [addStudentGroupId, setAddStudentGroupId] = useState(null);

  // ── Handlers ─────────────────────────────────────────────
  const handleAddGroup = async (data) => {
    await addGroup(data);
    show("تم إضافة المجموعة بنجاح ✨");
  };

  const handleDeleteGroup = async (id) => {
    if (!window.confirm("هل تريد بالتأكيد حذف هذه المجموعة وكل بيانات طلابها؟")) return;
    await deleteGroup(id);
    show("تم حذف المجموعة وكل بياناتها", "info");
  };

  const handleAddStudent = async (groupId, data) => {
    await addStudent(groupId, data);
    show("تم إضافة الطالب بنجاح ✅");
  };

  const handleUpdateStudent = async (groupId, studentId, updates) => {
    await updateStudent(groupId, studentId, updates);
  };

  const handleDeleteStudent = async (groupId, studentId) => {
    if (!window.confirm("هل تريد حذف هذا الطالب؟")) return;
    await deleteStudent(groupId, studentId);
    show("تم حذف الطالب من المجموعة", "info");
  };

  const handleAddWithdrawal = async (data) => {
    await addWithdrawal(data);
    show("تم تسجيل سحب من الخزنة بنجاح 💸");
  };

  const handleDeleteWithdrawal = async (id) => {
    if (!window.confirm("هل تريد بالتأكيد حذف حركة السحب هذه؟")) return;
    await deleteWithdrawal(id);
    show("تم حذف حركة السحب وإعادة المبلغ للخزنة", "info");
  };

  // ── Filter ────────────────────────────────────────────────
  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups;
    const q = search.toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        students: (g.students || []).filter(
          (s) =>
            s.name?.toLowerCase().includes(q) ||
            s.referral?.toLowerCase().includes(q) ||
            s.phone?.includes(q)
        ),
      }))
      .filter((g) => g.name.toLowerCase().includes(q) || g.students.length > 0);
  }, [groups, search]);

  // ── Render ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="it-root">
        <div className="it-loading">
          <div className="it-spinner" />
          <span>جاري تحميل قاعدة البيانات...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="it-root">
        <div className="it-empty">
          <div className="it-empty__icon">⚠️</div>
          <h3>خطأ في تحميل قاعدة البيانات</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="it-root">
      {/* Header */}
      <div className="it-header">
        <div className="it-header__title">
          <div className="it-header__icon">📊</div>
          <div>
            <h1>نظام متابعة الأقساط والخزنة</h1>
            <p className="it-header__subtitle">لوحة إدارة التدفقات النقدية والأقساط للطلاب</p>
          </div>
        </div>
        <div className="it-header__actions">
          <button
            className="it-btn it-btn--primary"
            onClick={() => setShowAddGroup(true)}
          >
            ➕ إضافة مجموعة
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="it-stats">
        <div className="it-stat it-stat--blue">
          <div className="it-stat__icon">🏫</div>
          <div className="it-stat__info">
            <div className="it-stat__label">المجموعات</div>
            <div className="it-stat__value">{stats.groupCount}</div>
          </div>
        </div>
        <div className="it-stat it-stat--cyan">
          <div className="it-stat__icon">👥</div>
          <div className="it-stat__info">
            <div className="it-stat__label">إجمالي الطلاب</div>
            <div className="it-stat__value">{stats.totalStudents}</div>
          </div>
        </div>
        <div className="it-stat it-stat--amber">
          <div className="it-stat__icon">💰</div>
          <div className="it-stat__info">
            <div className="it-stat__label">الإجمالي المتوقع</div>
            <div className="it-stat__value">{fmt(stats.totalRevenue)} ج.م</div>
          </div>
        </div>
        <div className="it-stat it-stat--green">
          <div className="it-stat__icon">📥</div>
          <div className="it-stat__info">
            <div className="it-stat__label">المحصّل</div>
            <div className="it-stat__value">{fmt(stats.totalCollected)} ج.m</div>
          </div>
        </div>
        <div className="it-stat it-stat--red">
          <div className="it-stat__icon">📤</div>
          <div className="it-stat__info">
            <div className="it-stat__label">السحوبات</div>
            <div className="it-stat__value">{fmt(stats.totalWithdrawals)} ج.م</div>
          </div>
        </div>
        <div className="it-stat it-stat--cyan" style={{ border: "1px solid rgba(6, 182, 212, 0.4)" }}>
          <div className="it-stat__icon">💵</div>
          <div className="it-stat__info">
            <div className="it-stat__label">صافي الخزنة</div>
            <div className="it-stat__value" style={{ color: "var(--it-cyan)" }}>{fmt(stats.vaultBalance)} ج.م</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="it-tabs">
        <button className={`it-tab ${tab === "groups" ? "active" : ""}`} onClick={() => setTab("groups")}>
          📂 مجموعات الأقساط
        </button>
        <button className={`it-tab ${tab === "summary" ? "active" : ""}`} onClick={() => setTab("summary")}>
          📊 الملخص العام
        </button>
        <button className={`it-tab ${tab === "withdrawals" ? "active" : ""}`} onClick={() => setTab("withdrawals")}>
          💸 الخزنة والسحوبات
        </button>
      </div>

      {/* Toolbar */}
      {tab === "groups" && (
        <div className="it-toolbar">
          <div className="it-search">
            <span className="it-search__icon">🔍</span>
            <input
              placeholder="ابحث باسم الطالب، الترشيح، أو رقم الهاتف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {saving && (
            <span style={{ color: "var(--it-muted)", fontSize: ".82rem", display: "flex", alignItems: "center", gap: 6 }}>
              <div className="it-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
              جاري مزامنة Firestore تلقائياً...
            </span>
          )}
        </div>
      )}

      {/* Main Tab Views */}
      {tab === "groups" && (
        <>
          {filteredGroups.length === 0 ? (
            <div className="it-empty">
              <div className="it-empty__icon">📭</div>
              <h3>{search ? "لا توجد نتائج بحث مطابقة" : "لا توجد مجموعات حتى الآن"}</h3>
              <p>{search ? "تأكد من كتابة الاسم أو رقم الهاتف بشكل صحيح" : "ابدأ بإنشاء أول مجموعة بالضغط على الزر أدناه"}</p>
              {!search && (
                <button className="it-btn it-btn--primary" onClick={() => setShowAddGroup(true)}>
                  ➕ إنشاء أول مجموعة
                </button>
              )}
            </div>
          ) : (
            <div className="it-groups">
              {filteredGroups.map((g) => (
                <GroupCard
                  key={g.id}
                  group={g}
                  onUpdate={updateGroup}
                  onDelete={handleDeleteGroup}
                  onAddStudent={(gid) => setAddStudentGroupId(gid)}
                  onUpdateStudent={handleUpdateStudent}
                  onDeleteStudent={handleDeleteStudent}
                />
              ))}
            </div>
          )}
        </>
      )}

      {tab === "summary" && <SummaryTab groups={groups} />}

      {tab === "withdrawals" && (
        <WithdrawalsTab
          withdrawals={withdrawals}
          onAdd={handleAddWithdrawal}
          onDelete={handleDeleteWithdrawal}
          collectedAmount={stats.totalCollected}
        />
      )}

      {/* Modals */}
      {showAddGroup && (
        <AddGroupModal onClose={() => setShowAddGroup(false)} onAdd={handleAddGroup} />
      )}
      {addStudentGroupId && (
        <AddStudentModal
          groupId={addStudentGroupId}
          onClose={() => setAddStudentGroupId(null)}
          onAdd={handleAddStudent}
        />
      )}

      {/* Toast Alert Notifications */}
      <div className="it-toast-wrap">
        {toasts.map((t) => (
          <div key={t.id} className={`it-toast it-toast--${t.type}`}>
            <span>{ICONS[t.type]}</span>
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
