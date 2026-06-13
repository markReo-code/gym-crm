import type { AppType } from "@repo/api/app";
import { hc } from "hono/client";

const client = hc<AppType>("http://localhost:8080");

const STATUS_CONFIG = {
  active: {
    label: "契約中",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  },
  inactive: {
    label: "退会済み",
    className: "bg-slate-100 text-slate-600 ring-slate-500/20",
  },
  suspended: {
    label: "休会中",
    className: "bg-amber-50 text-amber-700 ring-amber-600/20",
  },
} as const;

const Members = async () => {
  const res = await client.members.$get();

  if (!res.ok) {
    throw new Error("Failed to fetch members");
  }
  const members = await res.json();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8">
      <header className="border-b border-slate-200 pb-6">
        <p className="text-sm font-medium text-indigo-600">会員管理</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Members</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          テキスト。テキスト。テキストテキスト。テキスト。テキスト。テキスト。テキスト。テキスト。テキスト。テキスト。テキスト。
        </p>
      </header>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-5 py-4">会員名</th>
                <th className="px-5 py-4">プラン</th>
                <th className="px-5 py-4">入会日</th>
                <th className="px-5 py-4">最終更新日</th>
                <th className="px-5 py-4">ステータス</th>
                <th className="px-5 py-4 text-right">操作</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {members.map((member) => {
                const status = STATUS_CONFIG[member.status];

                return (
                  <tr key={member.id} className="">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">
                        {member.name}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {member.plan.name}
                    </td>

                    <td className="px-5 py-4 text-slate-500">
                      {new Date(member.createdAt).toLocaleDateString("ja-JP")}
                    </td>

                    <td className="px-5 py-4 text-slate-500">
                      {new Date(member.updatedAt).toLocaleDateString("ja-JP")}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold
  ring-1 ring-inset ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right text-slate-400">...</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Members;
