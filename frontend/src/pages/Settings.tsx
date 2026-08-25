import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useSettingsStore } from '@/stores/settingsStore';
import { useImportLinkedIn } from '@/hooks/useProfile';
import { toast } from '@/hooks/useToast';
import {
  Key,
  Target,
  Database,
  Workflow,
  CheckCircle2,
  XCircle,
  Plus,
  X,
  UploadCloud,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Cpu,
  Trash2,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsData {
  github_pat_set: boolean;
  indeed_api_key_set: boolean;
  gemini_key_set: boolean;
  target_roles: string[];
  sync_schedule: any;
}

export function Settings() {
  const queryClient = useQueryClient();
  const { targetRole, setTargetRole, clearCompletedWeeklyActions } = useSettingsStore();
  const [newRole, setNewRole] = useState('');
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const { mutate: importProfile, isPending: isImporting } = useImportLinkedIn();

  const { data: settings, isLoading } = useQuery<SettingsData>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/api/settings');
      return res.data;
    },
  });

  const { mutate: updateSettings, isPending: isSaving } = useMutation({
    mutationFn: async (target_roles: string[]) => {
      await api.put('/api/settings', { target_roles });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings Saved', 'Target career roles updated successfully');
      if (
        settings &&
        settings.target_roles &&
        !settings.target_roles.includes(targetRole) &&
        settings.target_roles.length > 0
      ) {
        setTargetRole(settings.target_roles[0]);
      }
    },
    onError: (err: any) => {
      toast.error('Failed to update settings', err?.message);
    },
  });

  const handleAddRole = () => {
    const role = newRole.trim();
    if (!role) return;

    const currentRoles = settings?.target_roles || [];
    if (currentRoles.includes(role)) {
      toast.warning('Role Exists', `"${role}" is already in your target roles list`);
      return;
    }

    updateSettings([...currentRoles, role]);
    setNewRole('');
  };

  const handleRemoveRole = (roleToRemove: string) => {
    if (!settings) return;
    const updated = settings.target_roles.filter((r) => r !== roleToRemove);
    updateSettings(updated);
  };

  const handleSelectActiveRole = (role: string) => {
    setTargetRole(role);
    toast.info('Active Target Role Set', `Default workspace role set to ${role}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.endsWith('.zip')) {
        toast.error('Invalid File Type', 'Please upload a .ZIP archive');
        return;
      }
      toast.info('Parsing LinkedIn Export', file.name);
      importProfile(file, {
        onSuccess: () => toast.success('LinkedIn Profile Imported!'),
        onError: (err: any) => toast.error('Import Failed', err?.message),
      });
    }
  };

  const handleConfirmResetScores = async () => {
    try {
      queryClient.clear();
      clearCompletedWeeklyActions();
      setIsResetDialogOpen(false);
      toast.success('Cache Reset Complete', 'All snapshot caches and weekly priorities have been refreshed');
    } catch (err: any) {
      toast.error('Reset Failed', err?.message);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-muted-foreground space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-medium">Loading System Diagnostics & Integrations...</p>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header Banner */}
      <div className="space-y-1 border-b border-border/40 pb-6">
        <h2 className="text-3xl font-extrabold font-heading tracking-tight text-foreground">
          System Settings & Integrations
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Manage your self-hosted Career OS API integrations, active target roles, and automated n8n sync triggers.
        </p>
      </div>

      <div className="grid gap-6">
        {/* API Connections & Service Diagnostics */}
        <Card className="glass-card border-border/40 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="pb-4 border-b border-border/30 bg-secondary/30">
            <CardTitle className="text-base font-bold font-heading flex items-center gap-2 text-foreground">
              <Key className="h-4.5 w-4.5 text-indigo-400" />
              API Service Connections
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Live status of environment credentials configured in your local <code className="text-indigo-400 font-mono">.env</code> file.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            {/* Gemini Integration */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/30 pb-4">
              <div className="space-y-1">
                <div className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                  Google Gemini 3.6 Flash
                </div>
                <div className="text-xs text-muted-foreground">
                  Powers the multi-agent AI orchestration layer (LinkedIn scoring, README synthesis, resume analysis).
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="text-[10px] font-mono bg-slate-900 text-indigo-300 border-border/40">
                  gemini-3.6-flash
                </Badge>
                <Badge
                  variant={settings?.gemini_key_set ? 'success' : 'destructive'}
                  className="gap-1 text-xs font-semibold px-2.5 py-0.5"
                >
                  {settings?.gemini_key_set ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {settings?.gemini_key_set ? 'Configured' : 'Missing Key'}
                </Badge>
              </div>
            </div>

            {/* GitHub PAT Integration */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/30 pb-4">
              <div className="space-y-1">
                <div className="font-bold text-sm text-foreground flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-purple-400" />
                  GitHub Personal Access Token (PAT)
                </div>
                <div className="text-xs text-muted-foreground">
                  Used for portfolio repository syncing, security scanning, and 1-click README pushes.
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="text-[10px] font-mono bg-slate-900 text-muted-foreground border-border/40">
                  Scope: repo, user
                </Badge>
                <Badge
                  variant={settings?.github_pat_set ? 'success' : 'destructive'}
                  className="gap-1 text-xs font-semibold px-2.5 py-0.5"
                >
                  {settings?.github_pat_set ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {settings?.github_pat_set ? 'Configured' : 'Missing PAT'}
                </Badge>
              </div>
            </div>

            {/* Indeed Job API */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-emerald-400" />
                  Indeed Job Market Engine
                </div>
                <div className="text-xs text-muted-foreground">
                  Fetches live job descriptions and extracts high-frequency keyword distributions.
                </div>
              </div>
              <Badge
                variant={settings?.indeed_api_key_set ? 'success' : 'info'}
                className="gap-1 text-xs font-semibold px-2.5 py-0.5 shrink-0"
              >
                {settings?.indeed_api_key_set ? <CheckCircle2 className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                {settings?.indeed_api_key_set ? 'Configured' : 'Fallback Scraper'}
              </Badge>
            </div>
          </CardContent>

          <CardFooter className="bg-secondary/40 py-3 border-t border-border/30">
            <p className="text-[11px] text-muted-foreground text-center w-full">
              Credentials are encrypted at rest. Edit <code className="text-indigo-300 font-mono">.env</code> in your root directory and restart containers to update API keys.
            </p>
          </CardFooter>
        </Card>

        {/* Target Roles Management */}
        <Card className="glass-card border-border/40 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="pb-4 border-b border-border/30 bg-secondary/30">
            <CardTitle className="text-base font-bold font-heading flex items-center gap-2 text-foreground">
              <Target className="h-4.5 w-4.5 text-indigo-400" />
              Target Roles Portfolio
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Active job titles used for Indeed JD scraping, keyword gap matrix, and bullet point rewrites. Click a role to set it as default.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <div className="flex flex-wrap gap-2.5">
              {settings?.target_roles.map((role) => {
                const isActive = targetRole.toLowerCase() === role.toLowerCase();

                return (
                  <div
                    key={role}
                    className={cn(
                      'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all select-none shadow-sm',
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-600/30'
                        : 'bg-secondary/40 text-foreground border-border/50 hover:border-indigo-500/40 hover:bg-secondary/70'
                    )}
                  >
                    <button
                      onClick={() => handleSelectActiveRole(role)}
                      className="cursor-pointer font-semibold flex items-center gap-1.5"
                    >
                      {isActive && <Check className="h-3.5 w-3.5" />}
                      {role}
                    </button>

                    <button
                      onClick={() => handleRemoveRole(role)}
                      className="text-muted-foreground hover:text-rose-400 transition-colors p-0.5 rounded-full"
                      title={`Remove ${role}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}

              {(!settings?.target_roles || settings.target_roles.length === 0) && (
                <span className="text-xs text-muted-foreground italic">
                  No target roles configured yet. Add one below.
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <Input
                placeholder="e.g. Staff AI Systems Engineer"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddRole()}
                className="max-w-md h-9 text-xs rounded-xl bg-slate-950/80 border-border/40"
              />
              <Button
                onClick={handleAddRole}
                disabled={isSaving || !newRole.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-9 text-xs font-semibold gap-1.5 shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                {isSaving ? 'Saving...' : 'Add Target Role'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data & Automations Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Data Export & Reset */}
          <Card className="glass-card border-border/40 shadow-xl rounded-2xl overflow-hidden flex flex-col justify-between">
            <CardHeader className="pb-4 border-b border-border/30 bg-secondary/30">
              <CardTitle className="text-base font-bold font-heading flex items-center gap-2 text-foreground">
                <Database className="h-4.5 w-4.5 text-indigo-400" />
                Data Management
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6 space-y-5 flex-1">
              <div className="flex items-center justify-between border-b border-border/30 pb-4">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-foreground">Re-import LinkedIn Archive</h4>
                  <p className="text-[11px] text-muted-foreground max-w-xs leading-relaxed">
                    Upload a new LinkedIn Data ZIP file to overwrite and re-score profile entries.
                  </p>
                </div>
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="settings-zip-upload"
                  disabled={isImporting}
                />
                <label htmlFor="settings-zip-upload">
                  <Button
                    asChild
                    disabled={isImporting}
                    variant="outline"
                    className="h-8 text-xs rounded-xl gap-1.5 border-border/50 cursor-pointer"
                  >
                    <span>
                      <UploadCloud className="h-3.5 w-3.5 text-indigo-400" />
                      {isImporting ? 'Importing...' : 'Upload ZIP'}
                    </span>
                  </Button>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-rose-400">Reset Local Caches</h4>
                  <p className="text-[11px] text-muted-foreground max-w-xs leading-relaxed">
                    Clear cached score snapshots, search history, and completed weekly priorities.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsResetDialogOpen(true)}
                  className="h-8 text-xs rounded-xl gap-1"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset Cache
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* n8n Scheduled Workflows */}
          <Card className="glass-card border-border/40 shadow-xl rounded-2xl overflow-hidden flex flex-col justify-between">
            <CardHeader className="pb-4 border-b border-border/30 bg-secondary/30">
              <CardTitle className="text-base font-bold font-heading flex items-center gap-2 text-foreground">
                <Workflow className="h-4.5 w-4.5 text-indigo-400" />
                n8n Scheduled Automations
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6 space-y-3 flex-1">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/30 bg-secondary/30">
                <div className="flex flex-col space-y-0.5">
                  <span className="font-bold text-xs text-foreground">Nightly GitHub Sync</span>
                  <span className="text-[10px] font-mono text-muted-foreground">Cron: 02:00 AM Nightly</span>
                </div>
                <Badge variant="outline" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-[10px] font-semibold">
                  Active
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/30 bg-secondary/30">
                <div className="flex flex-col space-y-0.5">
                  <span className="font-bold text-xs text-foreground">Weekly Market Analysis</span>
                  <span className="text-[10px] font-mono text-muted-foreground">Cron: 07:00 AM Mondays</span>
                </div>
                <Badge variant="outline" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-[10px] font-semibold">
                  Active
                </Badge>
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

      {/* Confirmation Modal for Reset Caches */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-400 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Reset Local Caches & Scores?
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-muted-foreground pt-1">
              This will clear TanStack Query cache, reset your completed weekly action list, and re-fetch fresh data from the FastAPI backend. Your credentials and database records remain safe.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsResetDialogOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmResetScores}
              className="text-xs gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Confirm Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Settings;
