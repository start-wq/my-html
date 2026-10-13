export default function MetricCard({ label, value, suffix = '' }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-800">
        {value}<span className="ml-1 text-base font-normal text-slate-500">{suffix}</span>
      </p>
    </article>
  )
}
