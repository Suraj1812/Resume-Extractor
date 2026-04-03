type LoaderProps = {
  label?: string;
};

export function Loader({ label = "Extracting data..." }: LoaderProps) {
  return (
    <div className="surface flex items-center gap-3 px-4 py-3">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
      <span className="text-sm text-slate-600">{label}</span>
    </div>
  );
}
