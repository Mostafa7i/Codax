'use client'
import React, { useState , useEffect } from "react";
const TextEffect = ({ toRotate = [] }) => {
  // نص متحرك
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [delta, setDelta] = useState(100); // سرعة الكتابة

  useEffect(() => {
    if (!toRotate || toRotate.length === 0) return;
    const tick = () => {
      const i = loopNum % toRotate.length; // النص الحالي
            const fullText = toRotate[i];
            const updatedText = isDeleting
              ? fullText.slice(0, text.length - 1)
              : fullText.slice(0, text.length + 1);
      
            setText(updatedText);
      
            if (!isDeleting && updatedText === fullText) {
              setTimeout(() => setIsDeleting(true), 1000); // توقف قبل الحذف
            } else if (isDeleting && updatedText === "") {
              setIsDeleting(false);
              setLoopNum(loopNum + 1);
            }
          };
      
          const timer = setTimeout(tick, delta);
          return () => clearTimeout(timer);
        }, [text, isDeleting, loopNum, delta]);


        return (
            <div>
              <span className="drop-shadow">{text}</span>
              <span className="animate-blink text-green-400 drop-shadow animate-crouser"></span> 
            </div>
          );
}
export default React.memo(TextEffect);