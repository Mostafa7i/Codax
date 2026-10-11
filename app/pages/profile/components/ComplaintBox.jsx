import { HelpCircle, MessageCircle, X , EyeOff  , User } from "lucide-react"; // أو أي أيقونات تحبها
import React, { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/app/services/firebaseConfig";
import Swal from "sweetalert2";
export default function ComplaintBox({ studentId, studentData }) {
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("شكوى طالب"); // الافتراضي
  const sendMessage = async () => {
    if (!message.trim()) return alert("اكتب رسالة الأول");

    setLoading(true);

    try {
      await addDoc(collection(db, "messages"), {
        studentId: studentId,
        message: message,
        name: studentData.name,
        isAnonymous: isAnonymous,
        type : type,
        createdAt: serverTimestamp(),
        read: false
      });

      setMessage("");
      await Swal.fire({
        icon: "success",
        title: "تم إرسال الرسالة",
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    } catch (error) {
      console.log(error);
      Swal.fire("خطأ", "فشل  اثناء الارسال", "error");
    }

    setLoading(false);
  };

  const types = [ "شكوى إداري","شكوى طالب", "شكوى مدرب", , "اقتراح", "أخرى"];

  return (
    <>
      {/* الزر العائم */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-40 hover:bg-blue-700 text-slate-100 p-4 rounded-full shadow-2xl transition hover:scale-110"
      >
        <MessageCircle className="w-7 h-7" />
      </button>

      {/* البوب أب */}
      {open && (
        <div className="fixed inset-0  bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`  ${isAnonymous ? "bg-black" : " bg-gray-800"}   rounded-xl shadow-2xl w-full max-w-md`}>
            {/* الهيدر */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-sm md:text-lg font-bold text-gray-400">صندوق الشكاوى والاقتراحات </h3>
              <div className="flex items-center gap-2">
                <button className="group relative">
                  <HelpCircle className="w-5 h-5 text-gray-500" />
                  <span className="absolute top-8 left-1/2 -translate-x-1/2 bg-black text-slate-100 text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                    مجهول = لا يظهر اسمك أبدًا ولا بياناتك لدينا
                  </span>
                </button>
                <button onClick={() => setOpen(false)}>
                  <X className="w-6 h-6 hover:text-red-600" />
                </button>
              </div>
            </div>
    
            <div className="p-5 space-y-4">
              {/* نوع الرسالة */}
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">
                  نوع الرسالة: 
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 bg-gray-700 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  {types.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              {/* مجهول أو باسمي */}
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!isAnonymous}
                    onChange={() => setIsAnonymous(false)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-500">باسمي</span>
                </label>
                <label className="flex  items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={isAnonymous}
                    onChange={() => setIsAnonymous(true)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="font-medium text-blue-600">
                     مجهول
                  </span>
                </label>
                  <span className="text-green-400">
                             {isAnonymous ? (
            <EyeOff />
        ) : (<User/>)}
                  </span>
              </div>

              {/* نص الرسالة */}
              <textarea
                rows={5}
                className="w-full bg-gray-700 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                placeholder="اكتب رسالتك هنا..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
  
                 
                    
              {/* الزر */}
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  {isAnonymous ? "مجهول 100%" : "باسمك"} • {type}
                </span>
                <button
                  onClick={sendMessage}
                  disabled={loading || !message.trim()}
                  className={`px-6 py-2.5 rounded-lg font-medium text-slate-100 transition ${
                    loading || !message.trim()
                      ? "bg-gray-400"
                      : "hover:bg-blue-700"
                  }`}
                >
                  {loading ? "جاري..." : "إرسال"}
                </button>
                
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
