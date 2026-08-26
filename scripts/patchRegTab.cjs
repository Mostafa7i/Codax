const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/Pages/StudentDetails.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const START_MARKER = `        {activeTab === "registrationData" && (`;
const END_MARKER = `        {activeTab === "pointsRequest" && (`;

const startIdx = content.indexOf(START_MARKER);
const endIdx = content.indexOf(END_MARKER);

if (startIdx === -1 || endIdx === -1) {
  console.error('Markers not found!', { startIdx, endIdx });
  process.exit(1);
}

const newSection = `        {activeTab === "registrationData" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="space-y-6 max-w-4xl mx-auto font-sans"
            dir="rtl"
          >
            {/* Hero Header */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05, duration: 0.5 }}
              className="relative rounded-3xl overflow-hidden shadow-2xl"
              style={{ background: "linear-gradient(135deg,#1e1b4b 0%,#312e81 40%,#4c1d95 100%)" }}
            >
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 15% 85%,#7c3aed,transparent 50%),radial-gradient(circle at 85% 15%,#4f46e5,transparent 50%)" }} />
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl" />

              <div className="relative p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-indigo-400/50 shadow-xl shadow-indigo-900/50">
                      <img src={state.profilePic || "/assets/person.webp"} alt="صورة الطالب"
                        className="w-full h-full object-cover" onError={(e) => { e.target.src = "/assets/person.webp"; }} />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full border-2 border-indigo-900 flex items-center justify-center shadow-md">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                  </div>

                  {/* Name Block */}
                  <div className="flex-1 text-center md:text-right">
                    <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-1">طالب CodaX</p>
                    <h2 className="text-2xl md:text-3xl font-black text-white mb-1 leading-tight">
                      {newStudentData?.arabicName || studentData?.name || "-"}
                    </h2>
                    <p className="text-indigo-300 text-sm font-medium mb-4" dir="ltr">
                      {newStudentData?.englishName || studentData?.englishName || "No English Name Set"}
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-end">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-indigo-200 border border-white/10 backdrop-blur-sm">
                        📞 {newStudentData?.phone || (studentData?.id ? String(studentData.id) : "-")}
                      </span>
                      {(newStudentData?.email || studentData?.email) && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-indigo-200 border border-white/10 backdrop-blur-sm">
                          ✉️ {newStudentData?.email || studentData?.email}
                        </span>
                      )}
                      {newStudentData?.track && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-200 border border-purple-500/30">
                          {newStudentData.track === "backend" ? "💻 Backend" : "🌐 Frontend"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {newStudentData?.contacted ? (
                      <span className="px-4 py-2 rounded-2xl text-xs font-black bg-green-500/20 text-green-300 border border-green-500/30 text-center">✓ تم التواصل</span>
                    ) : (
                      <span className="px-4 py-2 rounded-2xl text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 text-center">⏳ قيد التواصل</span>
                    )}
                    <Suspense fallback={null}>
                      <UploadProfilePic studentId={studentData?.id} onUploadSuccess={handleUploadSuccess} />
                    </Suspense>
                  </div>
                </div>

                {/* English Name Editor */}
                <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-amber-300 text-xs font-semibold">⚠️ الاسم الإنجليزي سيُكتب في الشهادة — يُقبل الحروف الإنجليزية فقط</p>
                  {!isEditingEnglishName ? (
                    <button onClick={() => { setEditedEnglishName(newStudentData?.englishName || studentData?.englishName || ""); setIsEditingEnglishName(true); }}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all">
                      <Pencil className="w-3 h-3" /> تعديل الاسم
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <input type="text" value={editedEnglishName}
                        onChange={(e) => setEditedEnglishName(e.target.value.replace(/[^A-Za-z\\s]/g, ""))}
                        className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-400 min-w-[180px]"
                        dir="ltr" placeholder="Full English Name" />
                      <button onClick={handleSaveEnglishName} disabled={isSavingEnglishName}
                        className="px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-black transition disabled:opacity-50">
                        {isSavingEnglishName ? "..." : "حفظ"}
                      </button>
                      <button onClick={() => setIsEditingEnglishName(false)}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition">إلغاء</button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {loadingNewStudent ? (
              <div className="flex justify-center items-center py-16">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 bg-indigo-500/20 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5">

                {/* Personal Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { icon: "🎂", label: "السن", value: newStudentData?.age || studentData?.age || "-", from: "from-pink-500/20", to: "to-rose-500/5", border: "border-pink-500/20", text: "text-pink-400", editKey: null },
                    { icon: "🏙️", label: "محل الإقامة", value: newStudentData?.city || studentData?.city || "-", from: "from-cyan-500/20", to: "to-blue-500/5", border: "border-cyan-500/20", text: "text-cyan-400", editKey: "city" },
                    { icon: "🎓", label: "الكلية / الدراسة", value: newStudentData?.college || studentData?.college || "-", from: "from-violet-500/20", to: "to-purple-500/5", border: "border-violet-500/20", text: "text-violet-400", editKey: "college" },
                  ].map((item, i) => (
                    <motion.div key={item.label}
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.07, duration: 0.45 }}
                      className={\`bg-gradient-to-br \${item.from} \${item.to} border \${item.border} rounded-2xl p-5 group hover:scale-[1.03] hover:shadow-lg transition-all duration-300 cursor-default\`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-2xl">{item.icon}</span>
                        {item.editKey && (
                          <button onClick={() => {
                              if (item.editKey === "city") { setEditedCity(newStudentData?.city || studentData?.city || ""); setIsEditingCity(true); }
                              if (item.editKey === "college") { setEditedCollege(newStudentData?.college || studentData?.college || ""); setIsEditingCollege(true); }
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 dark:bg-white/5 dark:hover:bg-white/10">
                            <Pencil className={\`w-3.5 h-3.5 \${item.text}\`} />
                          </button>
                        )}
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-wide mb-1">{item.label}</p>
                      {item.editKey === "city" && isEditingCity ? (
                        <div className="flex flex-col gap-2 mt-1">
                          <input value={editedCity} onChange={(e) => setEditedCity(e.target.value)}
                            className="bg-white/20 dark:bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 w-full" placeholder="محل الإقامة" />
                          <div className="flex gap-1">
                            <button onClick={handleSaveCity} disabled={isSavingCity} className="flex-1 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-bold transition disabled:opacity-50">{isSavingCity ? "..." : "حفظ"}</button>
                            <button onClick={() => setIsEditingCity(false)} className="flex-1 py-1.5 bg-gray-500/30 hover:bg-gray-500/50 text-white rounded-lg text-xs font-bold transition">إلغاء</button>
                          </div>
                        </div>
                      ) : item.editKey === "college" && isEditingCollege ? (
                        <div className="flex flex-col gap-2 mt-1">
                          <input value={editedCollege} onChange={(e) => setEditedCollege(e.target.value)}
                            className="bg-white/20 dark:bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-400 w-full" placeholder="الكلية / الدراسة" />
                          <div className="flex gap-1">
                            <button onClick={handleSaveCollege} disabled={isSavingCollege} className="flex-1 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-bold transition disabled:opacity-50">{isSavingCollege ? "..." : "حفظ"}</button>
                            <button onClick={() => setIsEditingCollege(false)} className="flex-1 py-1.5 bg-gray-500/30 hover:bg-gray-500/50 text-white rounded-lg text-xs font-bold transition">إلغاء</button>
                          </div>
                        </div>
                      ) : (
                        <p className={\`\${item.text} font-black text-lg leading-tight\`}>{item.value}</p>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Course & Finance Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Course Details */}
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25, duration: 0.5 }}
                    className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-xl">
                    <h3 className="text-gray-800 dark:text-white font-black text-sm flex items-center gap-2 mb-4">
                      <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900/40 rounded-xl flex items-center justify-center text-base">📚</span>
                      تفاصيل الكورس والاشتراك
                    </h3>
                    <div className="space-y-2.5">
                      {[
                        { label: "التراك", value: newStudentData?.track === "backend" ? "Backend 💻" : "Frontend 🌐" },
                        { label: "طريقة الدراسة", value: newStudentData?.studyMethod === "offline" ? "حضوري 🏫" : "أونلاين 🌐" },
                        { label: "الخبرة البرمجية", value: newStudentData?.hasExperience === "beginner" ? "🌱 بسيطة" : newStudentData?.hasExperience === "intermediate" ? "⚡ متوسطة" : newStudentData?.hasExperience === "advanced" ? "🚀 عالية" : "🚫 لا يوجد" },
                        { label: "المرشح (سيلز)", value: newStudentData?.referredBy || studentData?.referredBy || "لا يوجد" },
                        { label: "المجموعة", value: newStudentData?.group ? \`مجموعة \${newStudentData.group}\` : studentData?.group ? \`مجموعة \${studentData.group}\` : "غير مسجل" },
                        { label: "تاريخ التسجيل", value: newStudentData?.registrationDate ? new Date(newStudentData.registrationDate).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" }) : "-" },
                      ].map((r, i) => (
                        <motion.div key={r.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.05, duration: 0.3 }}
                          className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                          <span className="text-gray-400 dark:text-gray-500 text-xs font-semibold">{r.label}</span>
                          <span className="text-gray-800 dark:text-gray-200 text-sm font-bold">{r.value}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Financial */}
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
                    className="flex flex-col gap-3">
                    {[
                      { label: "سعر الكورس الإجمالي", value: \`\${totalPrice} ج.م\`, grad: "from-blue-600 to-indigo-700", icon: "💰" },
                      { label: "المبلغ المدفوع", value: \`\${paidAmount} ج.م\`, grad: "from-emerald-600 to-green-700", icon: "✅" },
                      { label: "المبلغ المتبقي", value: \`\${remainingAmountVal} ج.م\`, grad: remainingAmountVal <= 0 ? "from-emerald-600 to-green-700" : "from-red-600 to-rose-700", icon: remainingAmountVal <= 0 ? "🎉" : "⚠️" },
                    ].map((c, i) => (
                      <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.08 }}
                        className={\`bg-gradient-to-r \${c.grad} rounded-2xl px-5 py-4 flex items-center justify-between shadow-lg hover:scale-[1.02] transition-transform duration-300\`}>
                        <div>
                          <p className="text-white/60 text-[10px] font-semibold mb-0.5">{c.label}</p>
                          <p className="text-white text-xl font-black">{c.value}</p>
                        </div>
                        <span className="text-3xl filter drop-shadow-lg">{c.icon}</span>
                      </motion.div>
                    ))}
                    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-5 py-3 flex items-center justify-between">
                      <span className="text-gray-400 text-xs font-semibold">حالة الدفع</span>
                      <span className="px-3 py-1 rounded-full text-xs font-black" style={{ backgroundColor: statusColorBg, color: statusColorText, border: "1px solid currentColor" }}>{displayStatus}</span>
                    </div>
                    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-5 py-3 flex items-center justify-between">
                      <span className="text-gray-400 text-xs font-semibold">نوع الاشتراك</span>
                      <span className="text-gray-800 dark:text-gray-200 text-sm font-bold">{studentData?.subscriptionType || "كامل الكورس"}</span>
                    </div>
                  </motion.div>
                </div>

                {/* Account Security */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}
                  style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)" }}
                  className="rounded-3xl p-6 border border-indigo-900/50 shadow-2xl">
                  <h3 className="text-white font-black text-sm flex items-center gap-2 mb-5">
                    <span className="w-8 h-8 bg-indigo-900/60 border border-indigo-700/50 rounded-xl flex items-center justify-center">⚙️</span>
                    إعدادات الحساب والأمان
                  </h3>
                  <div className="flex flex-col md:flex-row gap-5">
                    {/* Password */}
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                      <p className="text-white/60 text-xs font-bold">🔑 تغيير كلمة المرور</p>
                      <div className="relative">
                        <input type={showLocalPassword ? "text" : "password"} value={localPassword}
                          onChange={(e) => setLocalPassword(e.target.value)}
                          placeholder="كلمة المرور الجديدة (5–10 أحرف)"
                          className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-right pl-10 transition" />
                        <button type="button" onClick={() => setShowLocalPassword(!showLocalPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition">
                          {showLocalPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <button onClick={handleLocalPasswordSave} disabled={isSavingPassword}
                        className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-black shadow-lg shadow-indigo-900/50 transition-all disabled:opacity-50">
                        {isSavingPassword ? "جاري الحفظ..." : "تحديث كلمة المرور"}
                      </button>
                      <div className="flex justify-center">
                        <Suspense fallback={null}><RestoreAnnouncementButton studentId={studentId} /></Suspense>
                      </div>
                    </div>
                    {/* Profile pic */}
                    <div className="w-full md:w-52 bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center gap-3">
                      <p className="text-white/60 text-xs font-bold">🖼️ صورة الحساب</p>
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-indigo-500/50 shadow-lg shadow-indigo-900/50 ring-4 ring-indigo-500/10">
                        <img src={state.profilePic || "/assets/person.webp"} alt="Profile"
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = "/assets/person.webp"; }} />
                      </div>
                      <Suspense fallback={<LoadingSpinner />}>
                        <UploadProfilePic studentId={studentData?.id} onUploadSuccess={handleUploadSuccess} />
                      </Suspense>
                    </div>
                  </div>
                </motion.div>

                {/* Admin Notes */}
                {(newStudentData?.note || studentData?.note) && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.4 }}
                    className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-3xl p-5 shadow-md">
                    <h4 className="text-amber-700 dark:text-amber-400 font-black text-sm flex items-center gap-2 mb-2">
                      <span>📝</span> ملاحظات إدارة CodaX:
                    </h4>
                    <p className="text-amber-900 dark:text-amber-200/80 text-sm leading-relaxed italic">
                      {newStudentData?.note || studentData?.note}
                    </p>
                  </motion.div>
                )}

              </div>
            )}
          </motion.div>
        )}
        `;

const before = content.substring(0, startIdx);
const after = content.substring(endIdx);
const result = before + newSection + after;

fs.writeFileSync(filePath, result, 'utf8');
console.log('✅ Done! Registration tab replaced successfully.');
