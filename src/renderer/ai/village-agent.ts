import type { AiToolDefinition } from '../../shared/ipc.ts';
import type { CharacterManager, AgentActionKey } from '../characters.ts';
import type { World } from '../world.ts';
import { observeWorld } from './observe.ts';
import { getAction } from './registry.ts';
import type { AiClient } from './client.ts';

const MIN_INTERVAL = 3 * 60;
const MAX_INTERVAL = 5 * 60;
const MAX_PER_DAY = 60;

interface AgentContext {
  weather(): string;
  season(): string;
  timeOfDay(): string;
  recentEvents(): string[];
}

interface VillageAgentOptions {
  now?: () => number;
  random?: () => number;
  minIntervalSeconds?: number;
  maxIntervalSeconds?: number;
  maxPerDay?: number;
}

export class VillageAgent {
  private ai: AiClient;
  private characters: CharacterManager;
  private world: World;
  private context: AgentContext;
  private now: () => number;
  private random: () => number;
  private minInterval: number;
  private maxInterval: number;
  private maxPerDay: number;
  private timer: number;
  private busy = false;
  private generation = 0;
  private cursor = -1;
  private day = -1;
  private countToday = 0;

  constructor(
    ai: AiClient,
    characters: CharacterManager,
    world: World,
    context: AgentContext,
    options: VillageAgentOptions = {},
  ) {
    this.ai = ai;
    this.characters = characters;
    this.world = world;
    this.context = context;
    this.now = options.now || (() => Date.now());
    this.random = options.random || Math.random;
    this.minInterval = options.minIntervalSeconds ?? MIN_INTERVAL;
    this.maxInterval = options.maxIntervalSeconds ?? MAX_INTERVAL;
    this.maxPerDay = options.maxPerDay ?? MAX_PER_DAY;
    this.timer = this.nextInterval();
  }

  setWorld(world: World) {
    this.world = world;
    this.generation++;
    this.timer = this.nextInterval();
  }

  update(dt: number) {
    if (!this.ai.settings.aiAgentEnabled || !this.ai.available() || this.busy) return;
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = this.nextInterval();
    void this.runOnce();
  }

  private nextInterval() {
    return this.minInterval + this.random() * (this.maxInterval - this.minInterval);
  }

  private underDailyLimit() {
    const day = Math.floor(this.now() / 86_400_000);
    if (day !== this.day) {
      this.day = day;
      this.countToday = 0;
    }
    return this.countToday < this.maxPerDay;
  }

  async runOnce(): Promise<boolean> {
    if (
      this.busy ||
      !this.ai.settings.aiAgentEnabled ||
      !this.ai.available() ||
      !this.underDailyLimit()
    ) {
      return false;
    }
    const reserved = this.characters.reserveAgentCandidate(this.cursor);
    if (!reserved) return false;
    this.cursor = reserved.index;
    const { candidate } = reserved;
    const generation = this.generation;
    const actions = this.characters.agentActionKeys(candidate.name);
    const tools = actions
      .map((key) => this.toolFor(key))
      .filter((tool): tool is AiToolDefinition => Boolean(tool));
    if (tools.length === 0) {
      this.characters.releaseAgentCandidate(candidate.name);
      return false;
    }

    const observed = observeWorld(this.world, candidate, {
      weather: this.context.weather(),
      season: this.context.season(),
      timeOfDay: this.context.timeOfDay(),
      recentEvents: this.context.recentEvents(),
      characters: this.characters.agentCharacters(),
    });
    const nearbyBlocks: Record<string, number> = {};
    let walkableNearby = 0;
    for (const cell of observed.nearby) {
      const key = cell.block || 'empty';
      nearbyBlocks[key] = (nearbyBlocks[key] || 0) + 1;
      if (cell.walkable) walkableNearby++;
    }
    const prompt = JSON.stringify({
      villager: {
        name: observed.self.name,
        job: observed.self.job,
        trait: observed.self.trait,
      },
      village: this.characters.agentSummary(),
      surroundings: { blocks: nearbyBlocks, walkableNearby, others: observed.others },
      weather: observed.weather,
      season: observed.season,
      timeOfDay: observed.timeOfDay,
      recentEvents: observed.recentEvents,
    });

    this.busy = true;
    this.countToday++;
    try {
      const choice = await this.ai.chooseAction({
        system:
          'You choose one gentle, useful activity for a villager in a cozy simulation. Call exactly one available function. Never invent coordinates or actions.',
        prompt,
        tools,
        maxOutputTokens: 128,
      });
      if (generation !== this.generation || !choice) return false;
      return this.characters.applyAgentAction(candidate.name, choice.name as AgentActionKey);
    } finally {
      this.characters.releaseAgentCandidate(candidate.name);
      this.busy = false;
    }
  }

  private toolFor(key: AgentActionKey): AiToolDefinition | null {
    const action = getAction(key);
    if (!action) return null;
    return {
      name: action.key,
      description: action.description,
      parameters: (action.params || {
        type: 'object',
        properties: {},
        required: [],
        additionalProperties: false,
      }) as Record<string, unknown>,
    };
  }
}
