
export function TopBar() {
  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-8">
      <div className="font-semibold text-lg"></div>
      <div className="text-sm text-muted-foreground flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500"></span>
        Last synced: Just now
      </div>
    </header>
  );
}
