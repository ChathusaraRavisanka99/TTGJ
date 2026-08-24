import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Ratnavue Admin" }, robots: { index: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await auth();
  // Defense in depth: middleware already gates /admin, but every server
  // entry point re-checks so nothing depends solely on the edge layer.
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/account/login?callbackUrl=/admin");
  }

  return (
    <div className="flex min-h-[calc(100vh-1px)] bg-ivory-soft">
      <AdminSidebar />
      <div className="flex-1 px-8 py-8">{children}</div>
    </div>
  );
}
