"use client";
import React, { useState, useCallback, useMemo } from "react";

const fmt = (n) =>
  Number(n || 0).toLocaleString("ar-EG", { maximumFractionDigits: 0 });

const instClass = (val, price) => {
  if (!val || val == 0) return "it-inst-zero";
  if (Number(val) >= Number(price)) return "it-inst-paid";
  return "it-inst-partial";
};

// ── Cell تعديل تلقائي ──────────────────────────────────────
function EditCell({ value, onChange, type = "text", placeholder = "" }) {
  const [v, setV] = useState(value ?? "");
  const commit = () => { if (v !== value) onChange(v); };
  return (
    <div className="it-cell">
      <input
        type={type}
        value={v}
        placeholder={placeholder}
        onChange={(e) => setV(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
      />
    </div>
  );
}

// ── سطر الطالب ─────────────────────────────────────────────
function StudentRow({ student, onUpdate, onDelete }) {
  const upd = (field) => (val) => onUpdate(student.id, { [field]: val });

  const totalCost = Number(student.priceFrontend || 0) + Number(student.priceBackend || 0);
  const totalPaid =
    Number(student.installment1 || 0) +
    Number(student.installment2 || 0) +
    Number(student.installment3 || 0);
  const remaining = totalCost - totalPaid;
  const pct = totalCost > 0 ? Math.min((totalPaid / totalCost) * 100, 100) : 0;

  return (
    <tr>
      {/* الاسم */}
      <td><EditCell value={student.name} onChange={upd("name")} placeholder="اسم الطالب" /></td>
      
      {/* الترشيح */}
      <td><EditCell value={student.referral || ""} onChange={upd("referral")} placeholder="الترشيح" /></td>
      
      {/* الرقم */}
      <td><EditCell value={student.phone || ""} onChange={upd("phone")} placeholder="رقم الهاتف" /></td>
      
      {/* سعر الفرونت */}
      <td><EditCell value={student.priceFrontend || ""} onChange={upd("priceFrontend")} type="number" placeholder="0" /></td>
      
      {/* سعر الباك */}
      <td><EditCell value={student.priceBackend || ""} onChange={upd("priceBackend")} type="number" placeholder="0" /></td>
      
      {/* القسط الأول */}
      <td>
        <span className={instClass(student.installment1, totalCost)}>
          <EditCell value={student.installment1 || ""} onChange={upd("installment1")} type="number" placeholder="0" />
        </span>
      </td>
      
      {/* تاريخ القسط الأول */}
      <td><EditCell value={student.date1 || ""} onChange={upd("date1")} type="date" /></td>
      
      {/* القسط الثاني */}
      <td>
        <span className={instClass(student.installment2, totalCost)}>
          <EditCell value={student.installment2 || ""} onChange={upd("installment2")} type="number" placeholder="0" />
        </span>
      </td>
      
      {/* تاريخ القسط الثاني */}
      <td><EditCell value={student.date2 || ""} onChange={upd("date2")} type="date" /></td>
      
      {/* القسط الثالث */}
      <td>
        <span className={instClass(student.installment3, totalCost)}>
          <EditCell value={student.installment3 || ""} onChange={upd("installment3")} type="number" placeholder="0" />
        </span>
      </td>
      
      {/* تاريخ القسط الثالث */}
      <td><EditCell value={student.date3 || ""} onChange={upd("date3")} type="date" /></td>
      
      {/* المتبقي */}
      <td style={{ color: remaining > 0 ? "var(--it-red)" : "var(--it-green)", fontWeight: 700 }}>
        {fmt(remaining)}
      </td>
      
      {/* التحصيل */}
      <td>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
          <div className="it-progress">
            <div
              className="it-progress__bar"
              style={{
                width: `${pct}%`,
                background: pct >= 100 ? "var(--it-green)" : pct >= 50 ? "var(--it-amber)" : "var(--it-red)",
              }}
            />
          </div>
          <span style={{ fontSize: ".7rem", color: "var(--it-muted)" }}>{Math.round(pct)}%</span>
        </div>
      </td>
      
      {/* ملاحظات */}
      <td><EditCell value={student.notes} onChange={upd("notes")} placeholder="ملاحظات" /></td>
      
      {/* حذف */}
      <td>
        <button
          className="it-btn it-btn--danger it-btn--xs it-btn--icon"
          onClick={() => onDelete(student.id)}
          title="حذف الطالب"
        >
          🗑
        </button>
      </td>
    </tr>
  );
}

// ── كارت المجموعة ──────────────────────────────────────────
export default function GroupCard({ group, onUpdate, onDelete, onAddStudent, onUpdateStudent, onDeleteStudent }) {
  const [open, setOpen]       = useState(true);
  const [editName, setEditName] = useState(false);
  const [nameDraft, setNameDraft] = useState(group.name);

  const students = group.students || [];

  // الحسابات التراكمية للمجموعة
  const totals = useMemo(() => {
    const frontend = students.reduce((s, x) => s + Number(x.priceFrontend || 0), 0);
    const backend  = students.reduce((s, x) => s + Number(x.priceBackend || 0), 0);
    const price    = frontend + backend;
    const inst1    = students.reduce((s, x) => s + Number(x.installment1 || 0), 0);
    const inst2    = students.reduce((s, x) => s + Number(x.installment2 || 0), 0);
    const inst3    = students.reduce((s, x) => s + Number(x.installment3 || 0), 0);
    const collected = inst1 + inst2 + inst3;
    const remaining = price - collected;
    const pct = price > 0 ? Math.min((collected / price) * 100, 100) : 0;
    return { frontend, backend, price, inst1, inst2, inst3, collected, remaining, pct };
  }, [students]);

  const commitName = () => {
    setEditName(false);
    if (nameDraft.trim() && nameDraft !== group.name)
      onUpdate(group.id, { name: nameDraft.trim() });
  };

  const handleUpdate = useCallback((sid, updates) => onUpdateStudent(group.id, sid, updates), [group.id, onUpdateStudent]);
  const handleDelete = useCallback((sid) => onDeleteStudent(group.id, sid), [group.id, onDeleteStudent]);

  return (
    <div className="it-group">
      {/* رأس المجموعة */}
      <div className="it-group__header">
        <span
          className="it-group__color-dot"
          style={{ background: group.color || "#6366f1" }}
        />

        <div className="it-group__name" onClick={() => !editName && setOpen((p) => !p)}>
          {editName ? (
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => e.key === "Enter" && commitName()}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span onDoubleClick={(e) => { e.stopPropagation(); setEditName(true); }}>
              {group.name}
            </span>
          )}
        </div>

        <div className="it-group__meta">
          <span className="it-group__badge">👤 {students.length} طالب</span>
          <span className="it-group__total">💰 {fmt(totals.collected)} ج.م</span>
          <div className="it-progress" style={{ width: 60 }}>
            <div
              className="it-progress__bar"
              style={{
                width: `${totals.pct}%`,
                background: totals.pct >= 100 ? "var(--it-green)" : totals.pct >= 50 ? "var(--it-amber)" : "var(--it-red)",
              }}
            />
          </div>
          <button
            className="it-btn it-btn--outline it-btn--xs"
            onClick={(e) => { e.stopPropagation(); setEditName(true); }}
            title="تعديل اسم المجموعة"
          >✏️</button>
          <button
            className="it-btn it-btn--danger it-btn--xs"
            onClick={(e) => { e.stopPropagation(); onDelete(group.id); }}
            title="حذف المجموعة"
          >🗑</button>
          <span className={`it-group__chevron ${open ? "open" : ""}`} onClick={() => setOpen((p) => !p)}>▼</span>
        </div>
      </div>

      {/* جدول المجموعة */}
      {open && (
        <>
          <div className="it-table-wrapper">
            <table className="it-table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>الترشيح</th>
                  <th>الرقم</th>
                  <th>سعر الفرونت</th>
                  <th>سعر الباك</th>
                  <th>القسط الأول</th>
                  <th>تاريخ 1</th>
                  <th>القسط الثاني</th>
                  <th>تاريخ 2</th>
                  <th>القسط الثالث</th>
                  <th>تاريخ 3</th>
                  <th>المتبقي</th>
                  <th>التحصيل</th>
                  <th>ملاحظات</th>
                  <th>حذف</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={15} style={{ textAlign: "center", padding: "24px", color: "var(--it-muted)" }}>
                      لا يوجد طلاب في هذه المجموعة — اضغط «إضافة طالب» للبدء
                    </td>
                  </tr>
                ) : (
                  students.map((s) => (
                    <StudentRow
                      key={s.id}
                      student={s}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                    />
                  ))
                )}
                
                {/* صف الإجماليات */}
                {students.length > 0 && (
                  <tr className="it-sum-row">
                    <td colSpan={3} style={{ textAlign: "center" }}>الإجمالي</td>
                    <td>{fmt(totals.frontend)}</td>
                    <td>{fmt(totals.backend)}</td>
                    <td>{fmt(totals.inst1)}</td>
                    <td></td>
                    <td>{fmt(totals.inst2)}</td>
                    <td></td>
                    <td>{fmt(totals.inst3)}</td>
                    <td></td>
                    <td style={{ color: totals.remaining > 0 ? "var(--it-red)" : "var(--it-green)" }}>
                      {fmt(totals.remaining)}
                    </td>
                    <td>{Math.round(totals.pct)}%</td>
                    <td colSpan={2}></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ذيل المجموعة (أزرار وإحصاءات سريعة) */}
          <div className="it-group__footer">
            <div className="it-group__footer-stats">
              <div className="it-group__footer-stat">
                <small>إجمالي السعر (فرونت + باك)</small>
                <span>{fmt(totals.price)} ج.م</span>
              </div>
              <div className="it-group__footer-stat">
                <small>المحصّل</small>
                <span style={{ color: "var(--it-green)" }}>{fmt(totals.collected)} ج.م</span>
              </div>
              <div className="it-group__footer-stat">
                <small>المتبقي للمجموعة</small>
                <span style={{ color: totals.remaining > 0 ? "var(--it-red)" : "var(--it-green)" }}>
                  {fmt(totals.remaining)} ج.م
                </span>
              </div>
              <div className="it-group__footer-stat">
                <small>نسبة التحصيل</small>
                <span style={{ color: "var(--it-primary-h)" }}>{Math.round(totals.pct)}%</span>
              </div>
            </div>
            <button
              className="it-btn it-btn--green it-btn--sm"
              onClick={() => onAddStudent(group.id)}
            >
              ➕ إضافة طالب
            </button>
          </div>
        </>
      )}
    </div>
  );
}
