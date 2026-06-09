import Link from "next/link";
import React from "react";

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
    <nav className="flex h-full min-h-screen flex-col gap-8 p-5">
      <div>
        <p className="text-lg font-bold text-indigo-700">GYM CRM</p>
      </div>

      <ul className="space-y-4">
        {navItems.map((item) => (
          <li key={item.value} className="font-bold">
            <Link href={`${item.href}`} className="block rounded-md px-3 py-2">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Sidebar;
