import type { ReactNode } from "react";
import Navbar from "@/components/Nav/Navbar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="pt-14">{children}</div>
    </>
  );
}
