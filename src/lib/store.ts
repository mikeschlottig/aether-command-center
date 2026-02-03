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
interface AgentStore {
  personas: AgentPersona[];
  activePersonaId: string | null;
  addPersona: (persona: AgentPersona) => void;
  updatePersona: (id: string, updates: Partial<AgentPersona>) => void;
  deletePersona: (id: string) => void;
  setActivePersona: (id: string | null) => void;
}
const DEFAULT_PERSONAS: AgentPersona[] = [
  {
    id: 'default-sage',
    name: 'Aether Sage',
    description: 'A wise guide for architectural decisions.',
    systemPrompt: 'You are the Aether Sage, a helpful AI focused on software architecture.',
    modelId: 'google-ai-studio/gemini-2.0-flash',
    avatar: '🧙‍��️',
    tools: ['get_weather', 'web_search']
  }
];
export const useAgentStore = create<AgentStore>()(
  persist(
    (set) => ({
      personas: DEFAULT_PERSONAS,
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
    }),
    { name: 'aether-command-store' }
  )
);