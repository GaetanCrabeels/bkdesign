import { ReactNode } from "react";

export function PageWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#111213] text-[#ffc272]">
      <div className="max-w-7xl mx-auto border-x-4 border-[#2a2b2c] px-6">
        {children}
      </div>
    </div>
  );
}
