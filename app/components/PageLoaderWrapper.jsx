"use client";
import dynamic from "next/dynamic";
import { Suspense } from "react";

// dynamic مع ssr:false مسموح فقط داخل Client Component
const PageLoader = dynamic(() => import("./PageLoader"), { ssr: false });

export default function PageLoaderWrapper() {
  return (
    <Suspense fallback={null}>
      <PageLoader />
    </Suspense>
  );
}
