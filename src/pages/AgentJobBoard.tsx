import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ClipboardList, Plus, Send, Trash2, CheckCircle2, User } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/illustrative/PageHeader';
import { useAgentStore, JobStatus, AgentJob } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
const statusMeta: Record<JobStatus, { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-muted text-muted-foreground border-border' },
  assigned: { label: 'Assigned', className: 'bg-primary text-primary-foreground border-primary/20' },
  done: { label: 'Done', className: 'bg-emerald-600 text-white border-emerald-700' },
};
const safeUuid = (): string => {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
      return globalThis.crypto.randomUUID();
    }
  } catch {
    // ignore
  }
  return `job-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};
export function AgentJobBoard(): JSX.Element {
  const navigate = useNavigate();
  const personas = useAgentStore((s) => s.personas);
  const jobs = useAgentStore((s) => s.jobs);
  const addJob = useAgentStore((s) => s.addJob);
  const updateJob = useAgentStore((s) => s.updateJob);
  const deleteJob = useAgentStore((s) => s.deleteJob);
  const setActivePersona = useAgentStore((s) => s.setActivePersona);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState<string>('none');
  const idCounterRef = useRef(0);
  const createLocalId = useCallback(() => {
    idCounterRef.current += 1;
    return `job-${safeUuid()}-${idCounterRef.current}`;
  }, []);
  const personaById = useMemo(() => {
    const map = new Map<string, { name: string; avatar: string }>();
    for (const p of personas) map.set(p.id, { name: p.name, avatar: p.avatar });
    return map;
  }, [personas]);
  const handleCreate = useCallback(() => {
    const cleanTitle = title.trim();
    const cleanDesc = description.trim();
    if (!cleanTitle) {
      toast.error('Missing Title', { description: 'Add a short job title to continue.' });
      return;
    }
    const assignedPersonaId = assigneeId !== 'none' ? assigneeId : null;
    const status: JobStatus = assignedPersonaId ? 'assigned' : 'open';
    const now = Date.now();
    const job: AgentJob = {
      id: createLocalId(),
      title: cleanTitle,
      description: cleanDesc,
      status,
      assignedPersonaId,
      createdAt: now,
      updatedAt: now,
    };
    addJob(job);
    toast.success('Job Created', { description: status === 'assigned' ? 'Assigned and ready.' : 'Open and ready.' });
    setTitle('');
    setDescription('');
    setAssigneeId('none');
    setOpen(false);
  }, [addJob, assigneeId, createLocalId, description, title]);
  const handleAssign = useCallback(
    (jobId: string, nextPersonaId: string) => {
      const assignedPersonaId = nextPersonaId === 'none' ? null : nextPersonaId;
      const nextStatus: JobStatus = assignedPersonaId ? 'assigned' : 'open';
      updateJob(jobId, { assignedPersonaId, status: nextStatus });
      toast.success('Job Updated', { description: assignedPersonaId ? 'Assignee set.' : 'Assignee cleared.' });
    },
    [updateJob]
  );
  const handleToggleDone = useCallback(
    (job: AgentJob) => {
      if (job.status === 'done') {
        const nextStatus: JobStatus = job.assignedPersonaId ? 'assigned' : 'open';
        updateJob(job.id, { status: nextStatus });
        toast.message('Job Reopened');
        return;
      }
      updateJob(job.id, { status: 'done' });
      toast.success('Marked Done');
    },
    [updateJob]
  );
  const handleSendToDeck = useCallback(
    (job: AgentJob) => {
      const assigned = job.assignedPersonaId || null;
      if (!assigned) {
        toast.error('No Assignee', { description: 'Assign an agent persona before sending to the Command Deck.' });
        return;
      }
      const persona = personaById.get(assigned);
      if (!persona) {
        toast.error('Unknown Assignee', { description: 'The assigned persona no longer exists.' });
        return;
      }
      setActivePersona(assigned);
      toast.success('Dispatched', { description: `Sending to ${persona.name} in the Command Deck.` });
      navigate('/deck');
    },
    [navigate, personaById, setActivePersona]
  );
  const empty = jobs.length === 0;
  return (
    <AppLayout container>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <PageHeader
          title="Agent Job Board"
          description="Create tasks, assign them to your crew, and dispatch work to the Command Deck. Everything here is local + persisted."
        />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg h-12 px-6 gap-2">
              <Plus className="h-5 w-5" />
              Create Job
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-serif">Create a New Job</DialogTitle>
              <DialogDescription>
                Define a task, optionally assign it to a persona, and track its status.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Title</Label>
                <Input
                  id="jobTitle"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Audit caching strategy"
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobDesc">Description</Label>
                <Textarea
                  id="jobDesc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add context, constraints, and expected output..."
                  className="min-h-[120px] bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label>Assignee (Optional)</Label>
                <Select value={assigneeId} onValueChange={setAssigneeId}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {personas.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.avatar} {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="mt-10 space-y-6">
        {empty ? (
          <Card className="card-illustrative border-primary/10 bg-primary/5">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                No Jobs Yet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Create your first job to begin dispatching tasks. If you don’t have agents yet, manifest them in the Atelier.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={() => setOpen(true)} className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                  Create Job
                </Button>
                <Link to="/atelier">
                  <Button variant="outline" className="rounded-xl border-primary/20 hover:border-primary/40 font-bold">
                    Manifest Agents
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {jobs.map((job) => {
              const meta = statusMeta[job.status];
              const assigneeLabel = job.assignedPersonaId ? personaById.get(job.assignedPersonaId)?.name : null;
              const assigneeAvatar = job.assignedPersonaId ? personaById.get(job.assignedPersonaId)?.avatar : null;
              return (
                <Card key={job.id} className="card-illustrative border-primary/10 bg-background">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="font-serif text-xl leading-tight truncate">{job.title}</CardTitle>
                        <div className="text-xs text-muted-foreground mt-1">
                          Updated {new Date(job.updatedAt).toLocaleString()}
                        </div>
                      </div>
                      <Badge className={cn("w-fit border", meta.className)} variant="outline">
                        {meta.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {job.description ? (
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{job.description}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No description provided.</p>
                    )}
                    <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div className="h-9 w-9 rounded-xl bg-accent border border-accent flex items-center justify-center text-lg">
                            {assigneeAvatar || <User className="h-4 w-4 text-muted-foreground" />}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                              Assignee
                            </div>
                            <div className="text-sm font-bold truncate">
                              {assigneeLabel || 'Unassigned'}
                            </div>
                          </div>
                        </div>
                        <Select
                          value={job.assignedPersonaId || 'none'}
                          onValueChange={(val) => handleAssign(job.id, val)}
                        >
                          <SelectTrigger className="w-[220px] bg-background border-2 border-primary/10 rounded-xl">
                            <SelectValue placeholder="Assign..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Unassigned</SelectItem>
                            {personas.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.avatar} {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-end">
                        <Button
                          variant="outline"
                          className="rounded-xl border-primary/20 hover:border-primary/40 font-bold"
                          onClick={() => handleToggleDone(job)}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          {job.status === 'done' ? 'Reopen' : 'Mark Done'}
                        </Button>
                        <Button
                          className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                          onClick={() => handleSendToDeck(job)}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Send to Deck
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              className="rounded-xl border-destructive/20 hover:bg-destructive/10 hover:border-destructive/40"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-serif">Delete Job?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This removes the job from your local board. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  deleteJob(job.id);
                                  toast.message('Job Deleted');
                                }}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}