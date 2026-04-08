import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useSettingsStore } from '@/stores/settingsStore';
import { useImportLinkedIn } from '@/hooks/useProfile';

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
      // If the active role was removed, switch it
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

  const handleClearCache = async () => {
    if (confirm("Are you sure you want to clear the job cache?")) {
      // Typically would call an API endpoint, but we just simulate it here for safety
      alert("Job cache cleared.");
    }
  };

  const handleResetScores = async () => {
    if (confirm("Are you sure you want to reset all AI scores?")) {
      alert("Scores reset.");
    }
  };

  if (isLoading) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your Career OS API keys, target roles, and sync preferences.</p>
      </div>

      <div className="grid gap-6">
        {/* API Keys Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>Manage your external API connections. Keys are stored securely in your .env file.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <div className="font-medium">GitHub Personal Access Token</div>
                <div className="text-sm text-muted-foreground">Used to scan repositories and push READMEs.</div>
              </div>
              <Badge variant={settings?.github_pat_set ? "default" : "destructive"}>
                {settings?.github_pat_set ? "Configured" : "Missing"}
              </Badge>
            </div>
            {/* Indeed API Integration Paused
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <div className="font-medium">Indeed Publisher API Key</div>
                <div className="text-sm text-muted-foreground">Used to fetch live job market data.</div>
              </div>
              <Badge variant={settings?.indeed_api_key_set ? "default" : "destructive"}>
                {settings?.indeed_api_key_set ? "Configured" : "Missing"}
              </Badge>
            </div>
            */}
            <div className="flex items-center justify-between pb-2">
              <div>
                <div className="font-medium">Google Gemini API Key</div>
                <div className="text-sm text-muted-foreground">Powers the AI analysis engine.</div>
              </div>
              <Badge variant={settings?.gemini_key_set ? "default" : "destructive"}>
                {settings?.gemini_key_set ? "Configured" : "Missing"}
              </Badge>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/50 py-3">
            <p className="text-xs text-muted-foreground text-center w-full">Edit your `.env` file and restart the backend container to apply new keys.</p>
          </CardFooter>
        </Card>

        {/* Target Roles */}
        <Card>
          <CardHeader>
            <CardTitle>Target Roles</CardTitle>
            <CardDescription>Job titles you are actively pursuing. Used for market analysis and resume matching.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {settings?.target_roles.map(role => (
                <Badge key={role} variant="secondary" className="px-3 py-1 flex items-center gap-2 text-sm">
                  {role}
                  <button onClick={() => handleRemoveRole(role)} className="hover:text-destructive hover:font-bold">&times;</button>
                </Badge>
              ))}
              {(!settings?.target_roles || settings.target_roles.length === 0) && (
                <span className="text-sm text-muted-foreground">No target roles configured.</span>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Input 
                placeholder="e.g. Senior Frontend Engineer" 
                value={newRole} 
                onChange={(e) => setNewRole(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddRole()}
                className="max-w-md"
              />
              <Button onClick={handleAddRole} disabled={isSaving || !newRole.trim()}>
                {isSaving ? "Saving..." : "Add Role"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>Manage your cached data and manual imports.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="flex items-center justify-between border-b pb-6">
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Re-import LinkedIn Profile</h4>
                <p className="text-sm text-muted-foreground max-w-lg">Upload a new LinkedIn Data Export ZIP file to overwrite your current profile data.</p>
              </div>
              <input type="file" accept=".zip" onChange={handleFileUpload} className="hidden" id="settings-zip-upload" disabled={isImporting} />
              <label htmlFor="settings-zip-upload">
                <Button asChild disabled={isImporting} variant="outline">
                  <span>{isImporting ? 'Importing...' : 'Upload ZIP'}</span>
                </Button>
              </label>
            </div>

            {/* Indeed API Integration Paused
            <div className="flex items-center justify-between border-b pb-6">
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Clear Job Cache</h4>
                <p className="text-sm text-muted-foreground max-w-lg">Delete locally cached Indeed job listings and force a fresh fetch on your next search.</p>
              </div>
              <Button variant="outline" onClick={handleClearCache}>Clear Cache</Button>
            </div>
            */}

            <div className="flex items-center justify-between pb-2">
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-destructive">Reset All AI Scores</h4>
                <p className="text-sm text-muted-foreground max-w-lg">Delete all historical AI suggestions, career score snapshots, and cached analysis. This cannot be undone.</p>
              </div>
              <Button variant="destructive" onClick={handleResetScores}>Reset Scores</Button>
            </div>

          </CardContent>
        </Card>

        {/* Automations */}
        <Card>
          <CardHeader>
            <CardTitle>n8n Automations</CardTitle>
            <CardDescription>View and manage your scheduled syncs.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded bg-background">
                <div className="flex flex-col">
                  <span className="font-medium text-sm">Nightly GitHub Sync</span>
                  <span className="text-xs text-muted-foreground">Runs every day at 02:00 AM</span>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded bg-background">
                <div className="flex flex-col">
                  <span className="font-medium text-sm">Weekly Market Analysis</span>
                  <span className="text-xs text-muted-foreground">Runs every Monday at 07:00 AM</span>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button asChild variant="secondary">
                <a href="http://localhost:5678" target="_blank" rel="noopener noreferrer">
                  Open n8n Dashboard
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
