import { ArrowLeft, BookOpen } from "lucide-react";
import LoadingLink from "../LoadingLink";

export default function RulesSection() {
  return (
    <section className="py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="relative rounded-3xl p-4 md:p-12 overflow-hidden border border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 backdrop-blur-sm group">

          <div className="absolute inset-0 bg-linear-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">

            <div className="flex items-center gap-5">

              <div className="p-2 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 shadow-xl">
                <BookOpen className="w-5 h-5 md:w-8 md:h-8 text-white" />
              </div>

              <div>
                <p className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold tracking-wider uppercase mb-1">
                  تعرّف علينا
                </p>

                <h3 className="md:text-3xl font-black text-slate-800 dark:text-white">
                  قواعد ومحتوى CodaX
                </h3>

                <p className="text-slate-500 dark:text-slate-400 mt-1">
                  اطّلع على المنهج الكامل والقواعد والمزايا
                </p>
              </div>

            </div>

            <LoadingLink
              href="pages/CodaxRules"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-500 text-white font-bold hover:bg-indigo-400 transition-colors"
            >
              <span>استعرض الآن</span>
              <ArrowLeft className="w-5 h-5" />
            </LoadingLink>

          </div>
        </div>
      </div>
    </section>
  );
}