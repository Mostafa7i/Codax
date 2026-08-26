import { Suspense } from "react";
import CertificateClient from "./CertificateClient";

export default function CertificatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500" />
        </div>
      }
    >
      <CertificateClient />
    </Suspense>
  );
}
