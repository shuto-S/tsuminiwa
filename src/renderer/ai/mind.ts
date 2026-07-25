export interface AgentMind {
  goal: string;
  memories: string[];
  relationships: Record<string, number>;
}

const MAX_GOAL = 48;
const MAX_MEMORY = 72;
const MAX_MEMORIES = 4;
const MAX_SPEECH = 40;

export function cleanMindText(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
}

export function normalizeMind(value: unknown): AgentMind {
  const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const relationships: Record<string, number> = {};
  if (
    source.relationships &&
    typeof source.relationships === 'object' &&
    !Array.isArray(source.relationships)
  ) {
    for (const [name, score] of Object.entries(source.relationships)) {
      const cleanName = cleanMindText(name, 32);
      if (!cleanName || !Number.isFinite(score)) continue;
      relationships[cleanName] = Math.max(0, Math.min(100, Math.round(Number(score))));
    }
  }
  const memories = Array.isArray(source.memories)
    ? source.memories
        .map((memory) => cleanMindText(memory, MAX_MEMORY))
        .filter(Boolean)
        .slice(-MAX_MEMORIES)
    : [];
  return {
    goal: cleanMindText(source.goal, MAX_GOAL),
    memories,
    relationships,
  };
}

export function addMemory(mind: AgentMind, memory: unknown): boolean {
  const clean = cleanMindText(memory, MAX_MEMORY);
  if (!clean || mind.memories.at(-1) === clean) return false;
  mind.memories.push(clean);
  if (mind.memories.length > MAX_MEMORIES) {
    mind.memories.splice(0, mind.memories.length - MAX_MEMORIES);
  }
  return true;
}

export function updateMind(mind: AgentMind, input: { goal?: unknown; memory?: unknown }): boolean {
  let changed = false;
  const goal = cleanMindText(input.goal, MAX_GOAL);
  if (goal && goal !== mind.goal) {
    mind.goal = goal;
    changed = true;
  }
  return addMemory(mind, input.memory) || changed;
}

export function cleanSpeech(value: unknown): string {
  return cleanMindText(value, MAX_SPEECH);
}

export const AGENT_INTENT_PARAMS = {
  type: 'object',
  properties: {
    goal: {
      type: 'string',
      description: 'A short first-person goal that can guide the next few decisions.',
    },
    memory: {
      type: 'string',
      description: 'One short factual memory from this decision, or an empty string.',
    },
    say: {
      type: 'string',
      description: 'One short in-character line to say now, or an empty string.',
    },
  },
  required: ['goal', 'memory', 'say'],
  additionalProperties: false,
} as const;
