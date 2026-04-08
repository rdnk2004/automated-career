import { useState } from 'react';
import { SuggestionSet } from '@/types/analysis';
import { KeywordGapBadges } from './KeywordGapBadges';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { useImportLinkedIn } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function SuggestionPanel({ suggestions }: { suggestions: SuggestionSet | null }) {
  const [tab, setTab] = useState<'gaps' | 'rewrites' | 'import'>('import');
  const { mutate: importProfile, isPending } = useImportLinkedIn();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      importProfile(e.target.files[0]);
    }
  };

  return (
    <Card className="flex flex-col h-full border-l rounded-none">
      <div className="flex border-b">
        <button className={`px-4 py-2 text-sm font-medium ${tab === 'gaps' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`} onClick={() => setTab('gaps')}>Keyword Gaps</button>
        <button className={`px-4 py-2 text-sm font-medium ${tab === 'rewrites' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`} onClick={() => setTab('rewrites')}>Rewrites</button>
        <button className={`px-4 py-2 text-sm font-medium ${tab === 'import' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`} onClick={() => setTab('import')}>Import</button>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto">
        {tab === 'import' && (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium mb-2">Upload LinkedIn Data Export</h3>
            <p className="text-sm text-muted-foreground mb-4">Upload the ZIP file containing your Profile.csv, Positions.csv, etc.</p>
            <input type="file" accept=".zip" onChange={handleFileUpload} className="hidden" id="zip-upload" disabled={isPending} />
            <label htmlFor="zip-upload">
              <Button asChild disabled={isPending} variant="outline">
                <span>{isPending ? 'Importing...' : 'Select ZIP File'}</span>
              </Button>
            </label>
          </div>
        )}
        
        {tab === 'gaps' && (
          <div>
            <h3 className="font-medium mb-4">Missing High-Frequency Keywords</h3>
            {suggestions ? <KeywordGapBadges gaps={suggestions.keyword_gaps} /> : <p className="text-sm text-muted-foreground">Run analysis to see keyword gaps.</p>}
          </div>
        )}
        
        {tab === 'rewrites' && (
          <div className="space-y-6">
            {!suggestions && <p className="text-sm text-muted-foreground">Run analysis to see AI rewrites.</p>}
            {suggestions?.rewrites.map((rewrite, i) => (
              <div key={i} className="border rounded-md overflow-hidden">
                <div className="bg-muted px-3 py-1 text-xs font-semibold flex gap-2">
                  {rewrite.evidence_refs?.map(ref => <span key={ref}>{ref}</span>)}
                </div>
                <ReactDiffViewer 
                  oldValue={rewrite.original || ''} 
                  newValue={rewrite.suggested} 
                  splitView={false} 
                  hideLineNumbers 
                  styles={{
                    variables: { light: { diffViewerBackground: 'transparent', addedBackground: 'rgba(34, 197, 94, 0.1)', removedBackground: 'rgba(239, 68, 68, 0.1)' } }
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
