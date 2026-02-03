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
interface AgentStore {
  personas: AgentPersona[];
  skills: CustomSkill[];
  activePersonaId: string | null;
  addPersona: (persona: AgentPersona) => void;
  updatePersona: (id: string, updates: Partial<AgentPersona>) => void;
  deletePersona: (id: string) => void;
  setActivePersona: (id: string | null) => void;
  saveSkill: (skill: CustomSkill) => void;
  deleteSkill: (id: string) => void;
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
export const useAgentStore = create<AgentStore>()(
  persist(
    (set) => ({
      personas: DEFAULT_PERSONAS,
      skills: INITIAL_SKILLS,
      activePersonaId: 'default-sage',
      addPersona: (persona) => set((state) => ({ personas: [...state.personas, persona] })),
      updatePersona: (id, updates) => set((state) => ({
        personas: state.personas.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      })),
      deletePersona: (id) => set((state) => ({
        personas: state.personas.filter((p) => p.id !== id),
        activePersonaId: state.activePersonaId === id ? null : state.activePersonaId,
      })),
      setActivePersona: (id) => set({ activePersonaId: id }),
      saveSkill: (skill) => set((state) => {
        const existing = state.skills.find(s => s.id === skill.id);
        if (existing) {
          return {
            skills: state.skills.map(s => s.id === skill.id ? { ...skill, updatedAt: Date.now() } : s)
          };
        }
        return { skills: [...state.skills, { ...skill, updatedAt: Date.now() }] };
      }),
      deleteSkill: (id) => set((state) => ({
        skills: state.skills.filter(s => s.id !== id)
      })),
    }),
    { name: 'aether-command-v6-production' }
  )
);