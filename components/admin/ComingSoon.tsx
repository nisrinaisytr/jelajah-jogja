// components/admin/ComingSoon.tsx
export default function ComingSoon({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="px-8 py-6">
      <h1 className="text-2xl font-extrabold text-slate-900">{icon} {title}</h1>
      <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
        <div className="text-4xl">🛠️</div>
        <h2 className="mt-3 text-lg font-bold text-slate-800">Sedang dibangun</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{desc}</p>
      </div>
    </div>
  );
}
