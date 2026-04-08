import { RepoScan } from '@/types/github';

export function SecurityScanPanel({ scan }: { scan?: RepoScan }) {
  if (!scan) {
    return <div className="text-sm text-muted-foreground p-4">No scan data available for this repository.</div>;
  }

  return (
    <div className="space-y-4 p-4 border rounded-md bg-card">
      <h3 className="font-medium">Security & Quality Scan</h3>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center justify-between p-2 border rounded">
          <span>.gitignore present</span>
          <span className={scan.has_gitignore ? "text-green-500" : "text-red-500 font-bold"}>
            {scan.has_gitignore ? "Yes" : "No"}
          </span>
        </div>
        <div className="flex items-center justify-between p-2 border rounded">
          <span>.env committed</span>
          <span className={scan.has_env_file ? "text-red-500 font-bold" : "text-green-500"}>
            {scan.has_env_file ? "Yes (Danger)" : "No"}
          </span>
        </div>
      </div>

      {scan.leaked_secrets && scan.leaked_secrets.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-destructive mb-2">Leaked Secrets Detected</h4>
          <ul className="space-y-2">
            {scan.leaked_secrets.map((secret, idx) => (
              <li key={idx} className="text-xs bg-destructive/10 text-destructive p-2 rounded">
                <span className="font-mono font-bold">{secret.file}</span> (Line {secret.line}): {secret.pattern}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(!scan.leaked_secrets || scan.leaked_secrets.length === 0) && (
        <div className="mt-4 text-sm text-green-600 bg-green-500/10 p-2 rounded">
          No hardcoded secrets found in scanned files.
        </div>
      )}

      {scan.ai_issues && scan.ai_issues.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold mb-2">Code Quality Issues</h4>
          <ul className="space-y-2">
            {scan.ai_issues.map((issue, idx) => (
              <li key={idx} className="text-xs bg-amber-500/10 text-amber-700 p-2 rounded">
                <span className="font-mono font-bold">{issue.file}</span>: {issue.description}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
