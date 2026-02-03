import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export interface AgentPersona {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  modelId: string;
  avatar: string;
  tools: string[];
}
export interface CustomSkill {
  id: string;
  name: string;
  code: string;
  language: string;
  description: string;
  updatedAt: number;
  bindings: {
    kv: string[];
    d1: string[];
    ai: boolean;
  };
}
export interface MCPServerDraft {
  id: string;
  name: string;
  sseUrl: string;
  enabled: boolean;
  createdAt: number;
}
export type JobStatus = 'open' | 'assigned' | 'done';
export interface AgentJob {
  id: string;
  title: string;
  description: string;
  status: JobStatus;
  assignedPersonaId?: string | null;
  createdAt: number;
  updatedAt: number;
}
export interface LearningModuleProgress {
  moduleId: string;
  completed: boolean;
  completedAt?: number;
}
interface AgentStore {
  personas: AgentPersona[];
  skills: CustomSkill[];
  activePersonaId: string | null;
  // Phase 10 additions
  mcpServers: MCPServerDraft[];
  jobs: AgentJob[];
  learningProgress: Record<string, LearningModuleProgress>;
  addPersona: (persona: AgentPersona) => void;
  updatePersona: (id: string, updates: Partial<AgentPersona>) => void;
  deletePersona: (id: string) => void;
  setActivePersona: (id: string | null) => void;
  saveSkill: (skill: CustomSkill) => void;
  deleteSkill: (id: string) => void;
  addMcpServer: (server: MCPServerDraft) => void;
  updateMcpServer: (id: string, updates: Partial<Omit<MCPServerDraft, 'id' | 'createdAt'>>) => void;
  removeMcpServer: (id: string) => void;
  toggleMcpServerEnabled: (id: string) => void;
  addJob: (job: AgentJob) => void;
  updateJob: (id: string, updates: Partial<Omit<AgentJob, 'id' | 'createdAt'>>) => void;
  deleteJob: (id: string) => void;
  setLearningModuleCompleted: (moduleId: string, completed: boolean) => void;
  toggleLearningModule: (moduleId: string) => void;
}
const DEFAULT_PERSONAS: AgentPersona[] = [
  {
    id: 'default-sage',
    name: 'Aether Sage',
    description: 'A wise guide for architectural decisions.',
    systemPrompt: 'You are the Aether Sage, a helpful AI focused on software architecture.',
    modelId: 'google-ai-studio/gemini-2.0-flash',
    avatar: '🧙‍♂���',
    tools: ['get_weather', 'web_search']
  }
];
const INITIAL_SKILLS: CustomSkill[] = [
  {
    id: 'weather-watcher-ts',
    name: 'weather-watcher.ts',
    language: 'typescript',
    description: 'Standard edge weather fetcher',
    updatedAt: Date.now(),
    code: `export async function get_weather(location: string) {\n  const endpoint = \`https://api.aether.com/weather/\${location}\`;\n  const response = await fetch(endpoint);\n  if (!response.ok) throw new Error('Cloud obstruction detected.');\n  return await response.json();\n}`,
    bindings: { kv: ['WEATHER_CACHE'], d1: [], ai: false }
  }
];
const safeUuid = (): string => {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
      return globalThis.crypto.randomUUID();
    }
  } catch {
    // ignore
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};
/**
 * Migration Notes (Phase 10)
 * - Added persisted slices: mcpServers, jobs, learningProgress.
 * - Kept persist storage name EXACTLY: "aether-command-v6-production".
 * - Added version + migrate/merge to ensure older localStorage entries hydrate with safe defaults
 *   without overwriting existing personas/skills/activePersonaId.
 */
export const useAgentStore = create<AgentStore>()(
  persist(
    (set) => ({
      personas: DEFAULT_PERSONAS,
      skills: INITIAL_SKILLS,
      activePersonaId: 'default-sage',
      mcpServers: [],
      jobs: [],
      learningProgress: {},
      addPersona: (persona) => set((state) => ({ personas: [...state.personas, persona] })),
      updatePersona: (id, updates) =>
        set((state) => ({
          personas: state.personas.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),
      deletePersona: (id) =>
        set((state) => ({
          personas: state.personas.filter((p) => p.id !== id),
          activePersonaId: state.activePersonaId === id ? null : state.activePersonaId,
        })),
      setActivePersona: (id) => set({ activePersonaId: id }),
      saveSkill: (skill) =>
        set((state) => {
          const existing = state.skills.find((s) => s.id === skill.id);
          if (existing) {
            return {
              skills: state.skills.map((s) => (s.id === skill.id ? { ...skill, updatedAt: Date.now() } : s)),
            };
          }
          return { skills: [...state.skills, { ...skill, updatedAt: Date.now() }] };
        }),
      deleteSkill: (id) =>
        set((state) => ({
          skills: state.skills.filter((s) => s.id !== id),
        })),
      addMcpServer: (server) =>
        set((state) => ({
          mcpServers: [...state.mcpServers, server],
        })),
      updateMcpServer: (id, updates) =>
        set((state) => ({
          mcpServers: state.mcpServers.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        })),
      removeMcpServer: (id) =>
        set((state) => ({
          mcpServers: state.mcpServers.filter((s) => s.id !== id),
        })),
      toggleMcpServerEnabled: (id) =>
        set((state) => ({
          mcpServers: state.mcpServers.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
        })),
      addJob: (job) =>
        set((state) => ({
          jobs: [job, ...state.jobs],
        })),
      updateJob: (id, updates) =>
        set((state) => ({
          jobs: state.jobs.map((j) => (j.id === id ? { ...j, ...updates, updatedAt: Date.now() } : j)),
        })),
      deleteJob: (id) =>
        set((state) => ({
          jobs: state.jobs.filter((j) => j.id !== id),
        })),
      setLearningModuleCompleted: (moduleId, completed) =>
        set((state) => {
          const prev = state.learningProgress[moduleId];
          const nextCompletedAt = completed ? Date.now() : undefined;
          const next: LearningModuleProgress = {
            moduleId,
            completed,
            completedAt: completed ? (prev?.completedAt ?? nextCompletedAt) : undefined,
          };
          return {
            learningProgress: {
              ...state.learningProgress,
              [moduleId]: next,
            },
          };
        }),
      toggleLearningModule: (moduleId) =>
        set((state) => {
          const prev = state.learningProgress[moduleId];
          const nextCompleted = !(prev?.completed ?? false);
          const next: LearningModuleProgress = {
            moduleId,
            completed: nextCompleted,
            completedAt: nextCompleted ? (prev?.completedAt ?? Date.now()) : undefined,
          };
          return {
            learningProgress: {
              ...state.learningProgress,
              [moduleId]: next,
            },
          };
        }),
    }),
    {
      name: 'aether-command-v6-production',
      version: 2,
      migrate: (persistedState, fromVersion) => {
        const state = (persistedState || {}) as Partial<AgentStore>;
        // If we ever need to hard-fix invalid data, do it here based on fromVersion.
        // For Phase 10: only default missing slices safely.
        const personas = Array.isArray(state.personas) && state.personas.length > 0 ? state.personas : DEFAULT_PERSONAS;
        const skills = Array.isArray(state.skills) ? state.skills : INITIAL_SKILLS;
        const activePersonaId =
          typeof state.activePersonaId === 'string'
            ? state.activePersonaId
            : (personas[0]?.id ?? null);
        const mcpServers = Array.isArray(state.mcpServers) ? state.mcpServers : [];
        const jobs = Array.isArray(state.jobs) ? state.jobs : [];
        const learningProgress =
          state.learningProgress && typeof state.learningProgress === 'object'
            ? (state.learningProgress as Record<string, LearningModuleProgress>)
            : {};
        const migrated: Partial<AgentStore> = {
          ...state,
          personas,
          skills,
          activePersonaId,
          mcpServers,
          jobs,
          learningProgress,
        };
        // Defensive normalization: ensure IDs exist for new slices if older drafts were malformed.
        migrated.mcpServers = (migrated.mcpServers || []).map((s) => ({
          id: s?.id || `mcp-${safeUuid()}`,
          name: s?.name || 'Untitled MCP Server',
          sseUrl: s?.sseUrl || '',
          enabled: typeof s?.enabled === 'boolean' ? s.enabled : false,
          createdAt: typeof s?.createdAt === 'number' ? s.createdAt : Date.now(),
        }));
        migrated.jobs = (migrated.jobs || []).map((j) => ({
          id: j?.id || `job-${safeUuid()}`,
          title: j?.title || 'Untitled Job',
          description: j?.description || '',
          status: (j?.status === 'open' || j?.status === 'assigned' || j?.status === 'done') ? j.status : 'open',
          assignedPersonaId: typeof j?.assignedPersonaId === 'string' ? j.assignedPersonaId : (j?.assignedPersonaId ?? null),
          createdAt: typeof j?.createdAt === 'number' ? j.createdAt : Date.now(),
          updatedAt: typeof j?.updatedAt === 'number' ? j.updatedAt : Date.now(),
        }));
        return migrated as any;
      },
      merge: (persisted, current) => {
        const p = (persisted || {}) as Partial<AgentStore>;
        return {
          ...current,
          ...p,
          // Ensure existing keys remain stable with safe defaults:
          personas: Array.isArray(p.personas) && p.personas.length > 0 ? p.personas : current.personas,
          skills: Array.isArray(p.skills) ? p.skills : current.skills,
          activePersonaId: typeof p.activePersonaId === 'string' ? p.activePersonaId : current.activePersonaId,
          // New Phase 10 slices:
          mcpServers: Array.isArray(p.mcpServers) ? p.mcpServers : current.mcpServers,
          jobs: Array.isArray(p.jobs) ? p.jobs : current.jobs,
          learningProgress:
            p.learningProgress && typeof p.learningProgress === 'object'
              ? (p.learningProgress as Record<string, LearningModuleProgress>)
              : current.learningProgress,
        } as AgentStore;
      },
    }
  )
);