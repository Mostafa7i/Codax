import React from "react";

export default function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-gray-700/50 text-sm">
      <span className="text-gray-400 font-semibold">{label}</span>
      <span className="text-gray-200 font-bold text-left">{value}</span>
    </div>
  );
}
