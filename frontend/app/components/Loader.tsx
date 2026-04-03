type LoaderProps = {
  label?: string;
};

export function Loader({ label = "Extracting resume..." }: LoaderProps) {
  return (
    <div className="flex items-center gap-3 rounded-3xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-medium text-orange-800">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-orange-300 border-t-orange-600" />
      <span>{label}</span>
    </div>
  );
}
