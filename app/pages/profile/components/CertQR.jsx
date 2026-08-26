import React from "react";
import { QRCodeSVG } from "qrcode.react";

export const CERT_BASE_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : "https://codax-dev.web.app";

export const padCertId = (id) => String(id || "").padStart(5, "0");

export const buildStudentCertId = (student) => {
  const sub = (student?.subscriptionType || "").toLowerCase();
  const course = (student?.certCourse || "").toLowerCase();
  const group = (student?.group || "").toLowerCase();
  const isFull =
    student?.isFullStack ||
    student?.certMode === "fullstack" ||
    sub.includes("full") ||
    course.includes("full") ||
    group.includes("full");
  const isBack =
    sub.includes("back") || course.includes("back") || group.includes("back");
  const prefix = isFull ? "FS" : isBack ? "BE" : "FE";
  return `CODAX-${prefix}-${new Date().getFullYear()}-${padCertId(student?.id)}`;
};

export const buildCertIssueDate = () =>
  new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

// QR with CodaX logo (SVG – for display)
export const StudentCodaxQR = ({ value, size = 200, logoSrc = "/favicon.png" }) => {
  const logoSize = size * 0.27;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <QRCodeSVG
        value={value}
        size={size}
        level="H"
        bgColor="#ffffff"
        fgColor="#0f172a"
        style={{ borderRadius: 12 }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: logoSize,
          height: logoSize,
          borderRadius: "50%",
          overflow: "hidden",
          border: "3px solid #fff",
          boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
          background: "#fff",
        }}
      >
        <img
          src={logoSrc}
          alt="CodaX"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    </div>
  );
};

// Download QR with logo
export const downloadCertQR = (canvasId, filename, logoSrc = "/favicon.png") => {
  const qrCanvas = document.getElementById(canvasId);
  if (!qrCanvas) return;
  const size = qrCanvas.width;
  const offscreen = document.createElement("canvas");
  offscreen.width = size;
  offscreen.height = size;
  const ctx = offscreen.getContext("2d");
  ctx.drawImage(qrCanvas, 0, 0);

  const logoImg = new Image();
  logoImg.crossOrigin = "anonymous";
  logoImg.onload = () => {
    const logoSize = size * 0.27;
    const x = (size - logoSize) / 2;
    const y = (size - logoSize) / 2;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, logoSize / 2 + 6, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, logoSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logoImg, x, y, logoSize, logoSize);
    ctx.restore();
    const link = document.createElement("a");
    link.download = `${filename}.png`;
    link.href = offscreen.toDataURL("image/png");
    link.click();
  };
  logoImg.src = logoSrc;
};
