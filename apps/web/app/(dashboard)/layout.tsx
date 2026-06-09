import Sidebar from "../../components/Sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:flex">
      <aside className="hidden border-r border-slate-200 bg-white lg:block lg:w-64">
        <Sidebar />
      </aside>
      <main className="min-h-screen flex-1">{children}</main>
    </div>
  );
}
