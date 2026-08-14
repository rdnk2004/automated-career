import { RepoScan } from '@/types/github';
import { ShieldAlert, ShieldCheck, AlertTriangle, FileCode, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SecurityScanPanel({ scan }: { scan?: RepoScan }) {
  if (!scan) {
    return (
      <div className="p-6 text-center text-muted-foreground glass-card rounded-2xl border border-dashed text-xs space-y-2">
        <ShieldAlert className="h-6 w-6 text-indigo-400/50 mx-auto" />
        <p>No scan data available. Click "Run Security Scan" to inspect secrets & code hygiene.</p>
      </div>
    );
  }

  const leakedSecrets = scan.leaked_secrets || [];
  const hasCriticalSecrets = leakedSecrets.length > 0;
  const hasEnvFile = scan.has_env_file;

  return (
    <div className="space-y-4 p-5 rounded-2xl glass-card border border-border/40 shadow-xl">
      <div className="flex items-center justify-between border-b border-border/30 pb-3">
        <h3 className="font-semibold text-sm font-heading text-foreground flex items-center gap-2">
          <Lock className="h-4 w-4 text-indigo-400" />
          Security & Code Hygiene Scan
        </h3>
        <div className="text-xs font-mono text-muted-foreground">
          {new Date(scan.scanned_at || Date.now()).toLocaleDateString()}
        </div>
      </div>
      
      {/* 2 Grid Key Indicators */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/30">
          <span className="text-muted-foreground font-medium flex items-center gap-1.5">
            <FileCode className="h-3.5 w-3.5 text-indigo-400" />
            .gitignore file
          </span>
          <span className={cn("font-bold text-[11px] px-2 py-0.5 rounded-md border", scan.has_gitignore ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" : "bg-rose-500/15 text-rose-400 border-rose-500/25")}>
            {scan.has_gitignore ? "Present" : "Missing"}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/30">
          <span className="text-muted-foreground font-medium flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            Committed .env
          </span>
          <span className={cn("font-bold text-[11px] px-2 py-0.5 rounded-md border", hasEnvFile ? "bg-rose-500/15 text-rose-400 border-rose-500/25 animate-pulse" : "bg-emerald-500/15 text-emerald-400 border-emerald-500/25")}>
            {hasEnvFile ? "DANGER (.env Leak)" : "Clean"}
          </span>
        </div>
      </div>

      {/* Leaked Secrets Alert Box */}
      {hasCriticalSecrets ? (
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4" />
            Leaked Hardcoded Secrets ({leakedSecrets.length})
          </h4>
          <ul className="space-y-2">
            {leakedSecrets.map((secret, idx) => (
              <li key={idx} className="text-xs bg-rose-500/10 text-rose-300 border border-rose-500/25 p-3 rounded-xl space-y-1 font-mono">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-rose-400">{secret.file}</span>
                  <span className="text-rose-400/80">Line {secret.line}</span>
                </div>
                <div className="text-[11px] text-muted-foreground font-sans">Pattern: {secret.pattern}</div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-center gap-2 font-medium">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          Zero hardcoded API keys or secret tokens detected in public code.
        </div>
      )}

      {/* Code Quality Issues */}
      {scan.ai_issues && scan.ai_issues.length > 0 && (
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            Code Quality & Architecture Insights
          </h4>
          <ul className="space-y-2">
            {scan.ai_issues.map((issue, idx) => (
              <li key={idx} className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20 p-3 rounded-xl">
                <span className="font-mono font-bold text-amber-400 block mb-0.5">{issue.file}</span>
                <span className="leading-relaxed">{issue.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
