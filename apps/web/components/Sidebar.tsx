import Link from "next/link";
import React from "react";
import LogoutButton from "./auth/LogoutButton";

type NavItem = {
  value: string;
  href: string;
  label: string;
};

const Sidebar = () => {
  const navItems: NavItem[] = [
    { value: "dashboard", href: "/dashboard", label: "ダッシュボード" },
    { value: "members", href: "/members", label: "会員管理" },
    { value: "settings", href: "/settings", label: "設定" },
  ];

  return (
    <>
      <aside className="hidden border-r border-slate-200 bg-white lg:block lg:w-64">
        <div className="flex min-h-screen flex-col ">
          <div className="px-5 pt-5">
            <Link href="/dashboard">
              <span className="text-lg font-bold text-indigo-700">GYM CRM</span>
            </Link>
          </div>

          <nav className="mt-8 px-5">
            <ul className="space-y-4">
              {navItems.map((item) => (
                <li key={item.value} className="font-bold">
                  <Link href={`${item.href}`} className="block rounded-md py-2">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-auto border-t border-slate-200 px-5 py-5">
            <LogoutButton />
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
