import { AuthGuard } from "../../components/auth/AuthGuard";
import Sidebar from "../../components/Sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 text-slate-900 lg:flex">
        <Sidebar />
        <main className="min-h-screen flex-1">{children}</main>
      </div>
    </AuthGuard>
  );
}
