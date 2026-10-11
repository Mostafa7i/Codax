"use client";
import React, { useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import {
  MapPin, Phone, Facebook, MessageCircle, Mail,
 Award, Users, Zap, Code2, Server,
  Star, Heart, Target, Sparkles, CheckCircle, ArrowLeft
} from "lucide-react";
import { useRouter } from "next/navigation";

// ── Reusable fade-in wrapper ─────────────────────────────────────────────────
const FadeIn = ({ children, delay = 0, direction = "up" }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });
  const initial = {
    opacity: 0,
    y: direction === "up" ? 30 : direction === "down" ? -30 : 0,
    x: direction === "left" ? 40 : direction === "right" ? -40 : 0,
  };
  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : initial}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ value, label, icon: Icon, color }) => (
  <div className={`flex flex-col items-center gap-2 p-5 rounded-2xl border ${color} bg-white/5 backdrop-blur-sm`}>
    <Icon size={28} className="opacity-80" />
    <span className="text-3xl font-black text-white">{value}</span>
    <span className="text-white/60 text-sm text-center">{label}</span>
  </div>
);

// ── Feature item ──────────────────────────────────────────────────────────────
const FeatureItem = ({ text }) => (
  <div className="flex items-center gap-3">
    <CheckCircle size={18} className="text-emerald-400 shrink-0" />
    <span className="text-white/80 text-sm">{text}</span>
  </div>
);

// ── Contact card ──────────────────────────────────────────────────────────────
const ContactCard = ({ href, icon: Icon, label, value, color, external = true }) => (
  <a
    href={href}
    target={external ? "_blank" : undefined}
    rel={external ? "noopener noreferrer" : undefined}
    className={`group flex items-center gap-4 p-4 rounded-2xl border ${color} bg-white/5 hover:bg-white/10 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1`}
  >
    <div className={`p-3 rounded-xl bg-white/10 group-hover:scale-110 transition-transform`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-white/50 text-xs mb-0.5">{label}</p>
      <p className="text-white font-bold text-sm">{value}</p>
    </div>
  </a>
);

// ── Main ──────────────────────────────────────────────────────────────────────
const Page = () => {
  const navigate = useRouter();

  // Scroll to top when page mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const features = [
    "تسجيلات فيديو لكل المحاضرات",
    "فرص مقابلات لاول ثلاثة",
    "PDF احترافي مجاناً لكل الطلاب",
    "+17 Tasks أسبوعية بتحاكي سوق العمل",
    "اختبارات أسبوعية وتقييم مستمر",
    "7 مشاريع خلال التراك",
    "متابعة مستمرة من المشرفين",
    "نظام متكامل علي الموقع",
    "أسئلة إنترفيو حقيقية",
    "مشاريع عملية متكاملة",
    "شهادة معتمدة عند الإنهاء",
    "نظام أوائل ومكافآت وتحفيز",
    "دعم مستمر ومتابعة فردية",
    "مجتمع طلابي نشط ومتفاعل",
  ];

  return (
    <div
      dir="rtl"
      className="min-h-screen pt-20 overflow-x-hidden"
      style={{ background: "linear-gradient(160deg, #0f0c29 0%, #1a1040 40%, #24243e 100%)" }}
    >
      {/* ── Decorative orbs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #a855f7, transparent 70%)" }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 pb-20">

        {/* ── HERO ── */}
        <section className="text-center py-16">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm font-semibold mb-6">
              <Sparkles size={14} className="text-yellow-400" />
              تعرّف علينا أكثر
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
              من نحن؟
              <br />
              <span className="bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                CodaX Academy
              </span>
            </h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
              منصة تعليمية متخصصة في تطوير الويب الاحترافي — نحوّل المبتدئين إلى مطورين محترفين جاهزين لسوق العمل بأقل تكلفة وأعلى جودة.
            </p>
          </FadeIn>
        </section>

        {/* ── STATS ── */}
        <section className="mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "500+", label: "طالب مسجّل", icon: Users, color: "border-indigo-500/30 text-indigo-300" },
              { value: "700+", label: "ساعة تدريب", icon: Zap, color: "border-purple-500/30 text-purple-300" },
              { value: "6+", label: "مشاريع عملية", icon: Code2, color: "border-cyan-500/30 text-cyan-300" },
              { value: "4.9★", label: "تقييم الطلاب", icon: Star, color: "border-yellow-500/30 text-yellow-300" },
            ].map((s, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <StatCard {...s} />
              </FadeIn>
            ))}
          </div>
        </section>

        {/* ── MISSION ── */}
        <section className="mb-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <FadeIn direction="right">
              <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600">
                    <Target size={22} className="text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-white">رسالتنا</h2>
                </div>
                <p className="text-white/70 leading-relaxed mb-4">
في Codax، لم تبدأ الفكرة بحملات إعلانية أو خطط تسويقية، بل بدأت عندما بحث الطلاب عن تجربة تعليمية مختلفة تجمع بين الفهم الحقيقي، التطبيق العملي، والدعم المستمر.

ومن هنا بدأت الرحلة…

اعتمدنا منذ البداية على جودة المحتوى، وقرب المحاضر من الطلاب، وبناء بيئة تعليمية يشعر فيها كل طالب أنه يتعلم ليصبح مطورًا حقيقيًا، وليس مجرد متابع لكورس تقليدي.

وخلال فترة قصيرة، توسعت المجاميع الواحدة تلو الأخرى دون أي حملات تسويقية، لأن أكبر سبب لاستمرارنا كان دائمًا ترشيحات الطلاب وتجاربهم الحقيقية.

رسالتنا ليست تقديم شرح فقط، بل بناء جيل قادر على التفكير، التطوير، والعمل في سوق البرمجيات بثقة وكفاءة.
                </p>
              </div>
            </FadeIn>

            <FadeIn direction="left" delay={0.1}>
              <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-linear-to-br from-emerald-500 to-teal-600">
                    <Award size={22} className="text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-white">ما يميّزنا</h2>
                </div>
                <div className="space-y-2.5">
                  {features.slice(0, 5).map((f, i) => (
                    <FeatureItem key={i} text={f} />
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ── INSTRUCTOR ── */}
        <section className="mb-16">
          <FadeIn>
            <h2 className="text-center text-3xl font-black text-white mb-10">
              <span className="bg-linear-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                المحاضر
              </span>
            </h2>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="relative p-8 rounded-3xl bg-linear-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-white/10 backdrop-blur-sm overflow-hidden">
              {/* Background glow */}
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10"
                style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)" }} />

              <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8">
                {/* Avatar placeholder */}
                <div className="shrink-0 w-32 h-32 rounded-3xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                  <Code2 size={52} className="text-white" />
                </div>

                <div className="flex-1 text-center md:text-right">
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold mb-3">
                    <Star size={12} className="text-yellow-400" />
                    المدرب الرئيسي
                  </div>

                  {/* Name & Title */}
                  <h3 className="text-3xl font-black text-white mb-1">ENG. Mostafa</h3>
                  <p className="text-indigo-300 font-semibold mb-5">Full Stack Web Developer &amp; Instructor</p>

                  {/* Bio */}
                  <p className="text-white/70 leading-relaxed mb-6 text-sm md:text-base">
                    مطوّر ويب ومحاضر متخصص في تقنيات الـ Front-End والـ Back-End منذ عام 2022،
                    يتميّز بأسلوب تدريسي عملي يُركّز على بناء مشاريع حقيقية وتأهيل الطلاب
                    لسوق العمل بكفاءة واحترافية.
                  </p>

                  {/* Achievements */}
                  <div className="grid grid-cols-1 gap-2.5 mb-6 text-right">
                    {[
                      { icon: "🏆", text: "جائزة أفضل محاضر لعام 2024 — كلية الهندسة، جامعة المنصورة" },
                      { icon: "🎓", text: "محاضر في جامعة المنصورة — كلية الهندسة" },
                      { icon: "📖", text: "محاضر في أكواد أكاديمي" },
                      { icon: "💻", text: "مطور في شركة الشروق" },
                      { icon: "📚", text: "محاضر في معهد الدلتا العالي" },
                      { icon: "🚀", text: "محاضر في أكاديمية كوداكس للبرمجيات" },
                      { icon: "⚡", text: "محاضر لدى دوت نت للبرمجيات" },
                    ].map(({ icon, text }, i) => (
                      <div key={i} className="flex items-start gap-3 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-base shrink-0">{icon}</span>
                        <span className="text-white/75 text-sm leading-snug">{text}</span>
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            </div>
          </FadeIn>
        </section>

        {/* ── CURRICULUM ── */}
        <section className="mb-16">
          <FadeIn>
            <h2 className="text-center text-3xl font-black text-white mb-10">
              المنهج الدراسي
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: "Frontend Track",
                subtitle: "المرحلة الأولى",
                icon: Code2,
                gradient: "from-cyan-500 to-blue-600",
                techs: ["HTML5", "CSS3", "SASS", "JavaScript", "Bootstrap", "Tailwind", "ReactJS"],
                desc: "بناء واجهات مستخدم احترافية وتطبيقات React متكاملة من الصفر",
              },
              {
                title: "Backend Track",
                subtitle: "المرحلة الثانية",
                icon: Server,
                gradient: "from-emerald-500 to-teal-600",
                techs: ["NodeJS", "Express JS", "MongoDB", "REST APIs", "Authentication"],
                desc: "بناء خوادم وقواعد بيانات وـAPIs قوية وآمنة",
              },
            ].map((track, i) => {
              const Icon = track.icon;
              return (
                <FadeIn key={i} delay={i * 0.15}>
                  <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/8 transition-all group">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`p-3 rounded-2xl bg-linear-to-br ${track.gradient} shadow-lg group-hover:scale-110 transition-transform`}>
                        <Icon size={22} className="text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-white/40 uppercase tracking-wider">{track.subtitle}</p>
                        <h3 className="text-xl font-black text-white">{track.title}</h3>
                      </div>
                    </div>
                    <p className="text-white/60 text-sm mb-4">{track.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {track.techs.map(t => (
                        <span key={t} className="px-3 py-1 rounded-full text-xs font-bold bg-white/8 border border-white/10 text-white/70">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>

          {/* Extra features */}
          <FadeIn delay={0.2}>
            <div className="mt-6 p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-linear-to-br from-amber-500 to-orange-600">
                  <Heart size={20} className="text-white" />
                </div>
                <h3 className="text-xl font-black text-white">مميزات إضافية</h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {features.slice(5).map((f, i) => (
                  <FeatureItem key={i} text={f} />
                ))}
              </div>
            </div>
          </FadeIn>
        </section>

        {/* ── LOCATION ── */}
        <section className="mb-16">
          <FadeIn>
            <h2 className="text-center text-3xl font-black text-white mb-10">الموقع</h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-start gap-4 mb-5">
                <div className="p-3 rounded-xl bg-linear-to-br from-rose-500 to-pink-600 shrink-0">
                  <MapPin size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-black text-lg mb-1">مقر التدريب</h3>
                  <p className="text-white/60">المنصورة — مصر</p>
                  <p className="text-white/50 text-sm mt-1">
                    جامعة المنصورة - شارع جيهان امام مستشفي مركز الجهاز الهضمي
                  </p>
                </div>
              </div>
              {/* Google Maps embed */}
              <div className="w-full rounded-2xl overflow-hidden border border-white/10" style={{ height: "280px" }}>
                <iframe
                  title="موقع CodaX Academy"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3421.0!2d31.3819!3d31.0409!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z2LzYs9iq4ZqZYXkgTWFuc291cmE!5e0!3m2!1sar!2seg!4v1234567890&q=جامعة+المنصورة+شارع+جيهان+مستشفى+مركز+الجهاز+الهضمي+المنصورة"
                />
              </div>
              <a
                href="https://maps.app.goo.gl/LRWRpf3DVeNLMufk8"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white text-sm font-semibold transition"
              >
                <MapPin size={15} className="text-rose-400" />
                فتح في Google Maps
              </a>
            </div>
          </FadeIn>
        </section>

        {/* ── CONTACT ── */}
        <section className="mb-16">
          <FadeIn>
            <h2 className="text-center text-3xl font-black text-white mb-10">تواصل معنا</h2>
          </FadeIn>
          <div className="grid sm:grid-cols-2 gap-4">
            <FadeIn delay={0}>
              <ContactCard
                href="https://wa.me/201023669672"
                target="_blank"
                rel="noopener noreferrer"
                icon={MessageCircle}
                value="01023669672"
                label="واتساب"
                color="border-emerald-500/30 hover:border-emerald-400/50"
              />
            </FadeIn>
            <FadeIn delay={0.1}>
              <ContactCard
                href="tel:01023669672"
                icon={Phone}
                label="هاتف"
                value="01023669672"
                color="border-indigo-500/30 hover:border-indigo-400/50"
                external={false}
              />
            </FadeIn>
            <FadeIn delay={0.2}>
              <ContactCard
                href="https://www.facebook.com/share/1Cw4PkDrh7/"
                icon={Facebook}
                label="فيسبوك"
                value="CodaX Academy"
                color="border-blue-500/30 hover:border-blue-400/50"
              />
            </FadeIn>
            <FadeIn delay={0.3}>
              <ContactCard
                href="codax.developer@gmail.com"
                icon={Mail}
                label="البريد الإلكتروني"
                value="codax.developer@gmail.com"
                color="border-purple-500/30 hover:border-purple-400/50"
                external={false}
              />
            </FadeIn>
          </div>
        </section>

        {/* ── CTA ── */}
        <section>
          <FadeIn>
            <div className="relative text-center p-10 rounded-3xl overflow-hidden border border-indigo-500/30"
              style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(168,85,247,0.15) 100%)" }}>
              <div className="absolute inset-0 opacity-5"
                style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #6366f1 1px, transparent 0)", backgroundSize: "40px 40px" }} />
              <div className="relative z-10">
                <Sparkles size={32} className="text-yellow-400 mx-auto mb-4" />
                <h2 className="text-3xl font-black text-white mb-3">مستعد للانطلاق؟</h2>
                <p className="text-white/60 mb-7 max-w-md mx-auto">
                  انضم لمئات الطلاب الذين غيّروا مساراتهم المهنية مع CodaX Academy
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate.push("/auth/Register")}
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-white text-lg shadow-2xl"
                  style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
                >
                  <Sparkles size={20} />
                  سجّل الآن مجاناً
                  <ArrowLeft size={20} />
                </motion.button>
              </div>
            </div>
          </FadeIn>
        </section>
      </div>
    </div>
  );
};

export default Page;
