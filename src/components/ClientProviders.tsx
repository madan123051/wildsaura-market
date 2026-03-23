"use client";

import { Toaster } from "react-hot-toast";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: "12px",
            background: "#0D1B2A",
            color: "#fff",
            fontSize: "14px",
          },
        }}
      />
      {children}
    </>
  );
}
