export function PageContainer({ children }) {
  return (
    <div className="flex-1 overflow-auto bg-slate-50 dark:bg-zinc-950">
      <div className="max-w-[1600px] mx-auto p-6">
        {children}
      </div>
    </div>
  );
}