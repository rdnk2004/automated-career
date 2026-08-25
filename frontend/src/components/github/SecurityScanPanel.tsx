import { useState } from 'react';
import { RepoScan } from '@/types/github';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/useToast';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileCode,
  Lock,
  Copy,
  Check,
  Terminal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function SecurityScanPanel({
  scan,
}: {
  scan?: RepoScan;
}) {
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedSecretIdx, setCopiedSecretIdx] = useState<number | null>(null);

  if (!scan) {
    return (
      <div className="p-8 text-center text-muted-foreground glass-card rounded-2xl border border-dashed border-border/40 text-xs space-y-3">
        <ShieldAlert className="h-8 w-8 text-indigo-400/50 mx-auto" />
        <div className="space-y-1">
          <h4 className="font-bold font-heading text-foreground text-sm">No Security Scan Performed</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Run a security scan above to audit this repository for committed `.env` files, leaked API tokens, and missing `.gitignore`.
          </p>
        </div>
      </div>
    );
  }

  const leakedSecrets = scan.leaked_secrets || [];
  const hasCriticalSecrets = leakedSecrets.length > 0;
  const hasEnvFile = scan.has_env_file;

  const handleCopyEnvRemediation = () => {
    const cmd = `git rm --cached .env && echo ".env" >> .gitignore && git commit -m "security: remove committed .env"`;
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(true);
    toast.success('Remediation Command Copied', 'Paste into your terminal to safely un-track the .env file');
    setTimeout(() => setCopiedCmd(false), 2500);
  };

  const handleCopySecretInfo = (sec: any, idx: number) => {
    navigator.clipboard.writeText(`${sec.file}:${sec.line} (${sec.pattern})`);
    setCopiedSecretIdx(idx);
    toast.success('Secret Reference Copied');
    setTimeout(() => setCopiedSecretIdx(null), 2000);
  };

  return (
    <div className="space-y-4 p-5 sm:p-6 rounded-2xl glass-card border border-border/40 shadow-2xl">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-border/30 pb-3.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Lock className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm font-heading text-foreground">
              Security & Code Hygiene Audit
            </h3>
            <p className="text-[11px] text-muted-foreground">Scanned via regex signature engine</p>
          </div>
        </div>

        <div className="text-[11px] font-mono text-muted-foreground bg-secondary/40 px-2.5 py-1 rounded-lg border border-border/40">
          {new Date(scan.scanned_at || Date.now()).toLocaleDateString()}
        </div>
      </div>

      {/* Grid Key Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/30 border border-border/30">
          <span className="text-muted-foreground font-medium flex items-center gap-2">
            <FileCode className="h-4 w-4 text-indigo-400" />
            .gitignore file
          </span>
          <Badge
            variant={scan.has_gitignore ? 'success' : 'destructive'}
            className="text-[11px] font-semibold px-2 py-0.5"
          >
            {scan.has_gitignore ? 'Present' : 'Missing'}
          </Badge>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/30 border border-border/30">
          <span className="text-muted-foreground font-medium flex items-center gap-2">
            <AlertTriangle className={cn('h-4 w-4', hasEnvFile ? 'text-rose-400' : 'text-emerald-400')} />
            Committed .env File
          </span>
          <Badge
            variant={hasEnvFile ? 'destructive' : 'success'}
            className={cn('text-[11px] font-semibold px-2 py-0.5', hasEnvFile && 'animate-pulse')}
          >
            {hasEnvFile ? 'LEAKED' : 'Clean'}
          </Badge>
        </div>
      </div>

      {/* Committed .env Remediation Quick Box */}
      {hasEnvFile && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2.5 animate-pop-in">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-rose-300 flex items-center gap-1.5 uppercase font-mono">
              <ShieldAlert className="h-4 w-4 text-rose-400" />
              Critical: Active .env File in Git History
            </h4>
            <Button
              variant="outline"
              size="xs"
              onClick={handleCopyEnvRemediation}
              className="h-6 text-[10px] gap-1 border-rose-500/40 text-rose-300 hover:bg-rose-500/20"
            >
              {copiedCmd ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copiedCmd ? 'Copied' : 'Copy Fix Command'}
            </Button>
          </div>
          <div className="p-2.5 bg-slate-950/90 rounded-xl font-mono text-[11px] text-rose-200 border border-rose-500/20 flex items-center gap-2 overflow-x-auto">
            <Terminal className="h-3.5 w-3.5 text-rose-400 shrink-0" />
            <code>git rm --cached .env && echo ".env" &gt;&gt; .gitignore</code>
          </div>
        </div>
      )}

      {/* Leaked Secrets Alert Box */}
      {hasCriticalSecrets ? (
        <div className="space-y-2.5 pt-1">
          <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4" />
            Detected Hardcoded Secrets ({leakedSecrets.length})
          </h4>
          <div className="space-y-2">
            {leakedSecrets.map((secret, idx) => (
              <div
                key={idx}
                className="text-xs bg-rose-500/10 text-rose-300 border border-rose-500/25 p-3 rounded-xl space-y-1.5 font-mono shadow-sm"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-rose-400">{secret.file}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-rose-400/80">Line {secret.line}</span>
                    <button
                      onClick={() => handleCopySecretInfo(secret, idx)}
                      className="p-1 rounded-md text-rose-400/70 hover:text-rose-200 hover:bg-rose-500/20 transition-colors"
                      title="Copy file & line"
                    >
                      {copiedSecretIdx === idx ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground font-sans">
                  Detected signature: <strong className="text-rose-200">{secret.pattern}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl flex items-center gap-2.5 font-medium">
          <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>Zero leaked credentials, OpenAI keys, or API tokens detected in public code.</span>
        </div>
      )}

      {/* Code Quality & AI Insights */}
      {scan.ai_issues && scan.ai_issues.length > 0 && (
        <div className="space-y-2.5 pt-2">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            Code Quality & Architecture Insights ({scan.ai_issues.length})
          </h4>
          <div className="space-y-2">
            {scan.ai_issues.map((issue, idx) => (
              <div
                key={idx}
                className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20 p-3 rounded-xl space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-amber-400">{issue.file}</span>
                  {issue.severity && (
                    <Badge variant="warning" className="text-[10px] uppercase font-mono px-1.5 py-0">
                      {issue.severity}
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground leading-relaxed font-sans">{issue.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
