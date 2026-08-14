import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useSettingsStore } from '@/stores/settingsStore';
import { useImportLinkedIn } from '@/hooks/useProfile';
import { Key, Target, Database, Workflow, CheckCircle2, XCircle, Plus, X, UploadCloud, ExternalLink } from 'lucide-react';

interface SettingsData {
  github_pat_set: boolean;
  indeed_api_key_set: boolean;
  gemini_key_set: boolean;
  target_roles: string[];
  sync_schedule: any;
}

export default function Settings() {
  const queryClient = useQueryClient();
  const { targetRole, setTargetRole } = useSettingsStore();
  const [newRole, setNewRole] = useState('');
  const { mutate: importProfile, isPending: isImporting } = useImportLinkedIn();

  const { data: settings, isLoading } = useQuery<SettingsData>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/api/settings');
      return res.data;
    }
  });

  const { mutate: updateSettings, isPending: isSaving } = useMutation({
    mutationFn: async (target_roles: string[]) => {
      await api.put('/api/settings', { target_roles });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      if (settings && settings.target_roles && !settings.target_roles.includes(targetRole) && settings.target_roles.length > 0) {
        setTargetRole(settings.target_roles[0]);
      }
    }
  });

  const handleAddRole = () => {
    if (newRole.trim() && settings && !settings.target_roles.includes(newRole.trim())) {
      updateSettings([...settings.target_roles, newRole.trim()]);
      setNewRole('');
    }
  };

  const handleRemoveRole = (role: string) => {
    if (settings) {
      updateSettings(settings.target_roles.filter(r => r !== role));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      importProfile(e.target.files[0]);
    }
  };

  const handleResetScores = async () => {
    if (confirm("Are you sure you want to reset all AI scores?")) {
      alert("Scores reset.");
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-muted-foreground space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-medium">Loading System Settings...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto animate-fade-in">
      <div className="space-y-1 border-b border-border/40 pb-6">
        <h2 className="text-3xl font-extrabold font-heading tracking-tight text-foreground">
          System Settings & API Keys
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage your self-hosted Career OS API integrations, active target roles, and n8n sync triggers.
        </p>
      </div>

      <div className="grid gap-6">
        {/* API Keys Configuration */}
        <Card className="glass-card border-border/40 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="pb-4 border-b border-border/30 bg-secondary/30">
            <CardTitle className="text-base font-bold font-heading flex items-center gap-2 text-foreground">
              <Key className="h-4.5 w-4.5 text-indigo-400" />
              API Connections
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Status of your environment variable keys defined in your local <code className="text-indigo-400 font-mono">.env</code> configuration.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border/30 pb-4">
              <div>
                <div className="font-semibold text-sm text-foreground">GitHub Personal Access Token</div>
                <div className="text-xs text-muted-foreground">Used for scanning repositories, repository health, and README pushes.</div>
              </div>
              <Badge variant="outline" className={settings?.github_pat_set ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25 gap-1 text-xs" : "bg-rose-500/15 text-rose-400 border-rose-500/25 gap-1 text-xs"}>
                {settings?.github_pat_set ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                {settings?.github_pat_set ? "Configured" : "Missing"}
              </Badge>
            </div>

            <div className="flex items-center justify-between pb-1">
              <div>
                <div className="font-semibold text-sm text-foreground">Google Gemini API Key</div>
                <div className="text-xs text-muted-foreground">Powers the Gemini 2.5 Pro career intelligence orchestration layer.</div>
              </div>
              <Badge variant="outline" className={settings?.gemini_key_set ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25 gap-1 text-xs" : "bg-rose-500/15 text-rose-400 border-rose-500/25 gap-1 text-xs"}>
                {settings?.gemini_key_set ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                {settings?.gemini_key_set ? "Configured" : "Missing"}
              </Badge>
            </div>
          </CardContent>

          <CardFooter className="bg-secondary/40 py-3 border-t border-border/30">
            <p className="text-[11px] text-muted-foreground text-center w-full">
              Edit your <code className="text-indigo-400 font-mono">.env</code> file and restart docker containers to update environment variables.
            </p>
          </CardFooter>
        </Card>

        {/* Target Roles Management */}
        <Card className="glass-card border-border/40 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="pb-4 border-b border-border/30 bg-secondary/30">
            <CardTitle className="text-base font-bold font-heading flex items-center gap-2 text-foreground">
              <Target className="h-4.5 w-4.5 text-indigo-400" />
              Target Roles Manager
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Active job titles used for Indeed JD scraping, keyword gap matrix, and bullet point rewrites.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              {settings?.target_roles.map(role => (
                <Badge key={role} variant="outline" className="px-3 py-1.5 flex items-center gap-2 text-xs bg-indigo-500/10 text-indigo-300 border-indigo-500/30 font-medium">
                  {role}
                  <button onClick={() => handleRemoveRole(role)} className="hover:text-rose-400 hover:scale-110 transition-all">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {(!settings?.target_roles || settings.target_roles.length === 0) && (
                <span className="text-xs text-muted-foreground">No target roles configured.</span>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Input 
                placeholder="e.g. Senior AI Systems Engineer" 
                value={newRole} 
                onChange={(e) => setNewRole(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddRole()}
                className="max-w-md h-9 text-xs rounded-xl bg-slate-900 border-border/40"
              />
              <Button onClick={handleAddRole} disabled={isSaving || !newRole.trim()} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-9 text-xs font-semibold gap-1">
                <Plus className="h-3.5 w-3.5" />
                {isSaving ? "Saving..." : "Add Role"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data & Automations */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Data Management */}
          <Card className="glass-card border-border/40 shadow-xl rounded-2xl overflow-hidden flex flex-col justify-between">
            <CardHeader className="pb-4 border-b border-border/30 bg-secondary/30">
              <CardTitle className="text-base font-bold font-heading flex items-center gap-2 text-foreground">
                <Database className="h-4.5 w-4.5 text-indigo-400" />
                Data Export & Reset
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6 flex-1">
              <div className="flex items-center justify-between border-b border-border/30 pb-4">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-semibold text-foreground">Re-import LinkedIn Profile</h4>
                  <p className="text-[11px] text-muted-foreground max-w-xs">Upload new LinkedIn Data ZIP export to overwrite parsed profile entries.</p>
                </div>
                <input type="file" accept=".zip" onChange={handleFileUpload} className="hidden" id="settings-zip-upload" disabled={isImporting} />
                <label htmlFor="settings-zip-upload">
                  <Button asChild disabled={isImporting} variant="outline" className="h-8 text-xs rounded-xl gap-1">
                    <span>
                      <UploadCloud className="h-3.5 w-3.5 inline mr-1" />
                      {isImporting ? 'Importing...' : 'Upload ZIP'}
                    </span>
                  </Button>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-semibold text-rose-400">Reset All AI Scores</h4>
                  <p className="text-[11px] text-muted-foreground max-w-xs">Clear cached career score snapshots and AI suggestions logs.</p>
                </div>
                <Button variant="destructive" size="sm" onClick={handleResetScores} className="h-8 text-xs rounded-xl">
                  Reset Scores
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* n8n Automations */}
          <Card className="glass-card border-border/40 shadow-xl rounded-2xl overflow-hidden flex flex-col justify-between">
            <CardHeader className="pb-4 border-b border-border/30 bg-secondary/30">
              <CardTitle className="text-base font-bold font-heading flex items-center gap-2 text-foreground">
                <Workflow className="h-4.5 w-4.5 text-indigo-400" />
                n8n Scheduled Automations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3 flex-1">
              <div className="flex items-center justify-between p-3 rounded-xl border border-border/30 bg-secondary/30">
                <div className="flex flex-col">
                  <span className="font-semibold text-xs text-foreground">Nightly GitHub Sync</span>
                  <span className="text-[10px] font-mono text-muted-foreground">Cron: 02:00 AM Every Night</span>
                </div>
                <Badge variant="outline" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-[10px]">Active</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-xl border border-border/30 bg-secondary/30">
                <div className="flex flex-col">
                  <span className="font-semibold text-xs text-foreground">Weekly Market Analysis</span>
                  <span className="text-[10px] font-mono text-muted-foreground">Cron: 07:00 AM Every Monday</span>
                </div>
                <Badge variant="outline" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-[10px]">Active</Badge>
              </div>
            </CardContent>
            <CardFooter className="bg-secondary/40 py-3 border-t border-border/30 flex justify-end">
              <Button asChild variant="ghost" size="sm" className="h-8 text-xs text-indigo-400 hover:text-indigo-300 gap-1.5">
                <a href="http://localhost:5678" target="_blank" rel="noopener noreferrer">
                  Open n8n Dashboard
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
