import type { FishingPlan, FishingPlanParams } from '../types';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

/**
 * Build the expert fishing plan prompt.
 * This is deliberately rich and specific to inshore saltwater fishing.
 */
function buildPrompt(params: FishingPlanParams): string {
  const { location, date, tides, solunar, weather, targetSpecies } = params;

  const tidesFormatted = tides
    .map(
      (t) =>
        `  ${t.time} — ${t.type === 'H' ? 'HIGH' : 'LOW'} tide at ${t.height.toFixed(1)} ft`
    )
    .join('\n');

  const majorPeriods = solunar.majorPeriods
    .map(([s, e]) => `  ${s}–${e}`)
    .join('\n');

  const minorPeriods = solunar.minorPeriods
    .map(([s, e]) => `  ${s}–${e}`)
    .join('\n');

  const speciesList = targetSpecies && targetSpecies.length > 0
    ? targetSpecies.join(', ')
    : 'Redfish, Speckled Trout, Flounder';

  const moonPct = Math.round(solunar.moonPhase * 100);

  return `You are an expert inshore saltwater fishing guide with 20+ years of experience in the Gulf Coast and Atlantic Intracoastal waterways. Generate a detailed fishing plan for today.

## Environmental Conditions

**Location:** ${location.name ?? `${location.lat.toFixed(4)}°N, ${Math.abs(location.lon).toFixed(4)}°W`}
**Date:** ${date}

**Tides (NOAA MLLW):**
${tidesFormatted}

**Moon & Solunar:**
- Phase: ${solunar.moonPhaseName} (${moonPct}%)
- Sunrise: ${solunar.sunrise} | Sunset: ${solunar.sunset}
- Moonrise: ${solunar.moonrise} | Moonset: ${solunar.moonset}
- MAJOR Solunar Periods (peak feeding activity, 2-hour windows):
${majorPeriods}
- Minor Solunar Periods (secondary feeding activity, 1-hour windows):
${minorPeriods}

**Weather:**
- Wind: ${weather.windSpeed} mph from ${weather.windDirectionCardinal} (${weather.windDirection}°)
- Temperature: ${weather.temperature}°F
${weather.waveHeight != null ? `- Wave Height: ${weather.waveHeight} ft\n` : ''}- Conditions: ${weather.weatherDescription}

**Target Species:** ${speciesList}

## Expert Context to Apply

**Tide Movement Strategy:**
- Moving water (2 hours before and after a tide change) concentrates baitfish and predators at structure
- Incoming tide: fish flood tide flats, oyster bars on the high-water side, and creek mouths as water rises over grass flats
- Outgoing tide: fish drain points, channel edges, cuts between flats, and the mouths of drains where baitfish funnel out
- Slack tide (within 30 min of high or low): fish often go lockjaw; switch to slow finesse presentations or move to deeper structure

**Species-Specific Behavior:**
- **Redfish (Red Drum):** Love oyster bars, mangrove edges, and shallow grass flats on moving water. Tail on flats < 2 ft. Best on outgoing tide draining across bars. Bronze-colored flash in mullet imitators. DOA Shrimp, gold spoons, and Z-Man soft plastics on jig heads work well.
- **Speckled Trout (Spotted Seatrout):** Glass minnow schools on open flats and nearshore grass. Early morning topwater (She Dog, Heddon Super Spook Jr.) in low-light. Switch to Mirrolure 52M or Matrix Shad on jig when sun is high. Love 63–70°F water.
- **Flounder:** Ambush predators at the edges of structure — dock pilings, channel drop-offs, creek mouths. Best on outgoing tide when baitfish funnel past. Dead-drift Gulp! Shrimp or paddle-tail on 1/4 oz jig head. Very slow retrieve.
- **Snook:** Mangrove shorelines, bridge shadows, creek mouths. Night bite around lights. Live pinfish, pilchards, or snook jigs (white DOA CAL). Snook face into current; cast upcurrent and swing the bait past them.
- **Tarpon:** Deep channels and passes on incoming tide. Live crabs, pinfish, or mullet. Rolling fish = feeding fish. Fly: EP Baitfish, Toad. Spin: 1 oz blue/silver spoon, black Mirrolure.
- **Sheepshead:** Structure specialists — docks, bridges, jetties, oyster bars. Always. Fiddler crabs, shrimp, barnacles scraped from pilings. Fish vertical with 1/8–1/4 oz jig tipped with fiddler crab.
- **Black Drum:** Similar to redfish. Oyster bars, channels with shell bottom, bridges. Shrimp, crab, cut mullet on bottom rig. Often in schools. Low strike visibility — feel for subtle thump.
- **Cobia:** Follow rays and sea turtles in open water near passes. Live eel, chunked menhaden, or 1 oz jig (white or chartreuse). Sight-fish from elevated position.

**Wind & Structure Adjustment:**
- Wind < 10 mph: fish exposed flats and open water freely
- Wind 10–20 mph: find leeward shorelines with wind pushing baitfish in; fish current seams and eddies
- Wind > 20 mph: shelter behind keys/islands, fish protected coves and deep channels, switch to heavier jig heads (1/2–3/4 oz) for casting into wind

**Solunar Integration:**
- Major solunar periods during moving water = PRIME TIME; double your effort here
- Major periods during slack tide = good subsurface bite but slower topwater
- Minor periods = worth fishing but don't abandon productive structure
- New/Full moon = strongest tidal movement and most pronounced solunar activity

## Output Format

Return a valid JSON object matching this TypeScript interface exactly:
\`\`\`typescript
interface FishingPlan {
  date: string;
  location: { lat: number; lon: number; name?: string };
  summary: string; // 2-3 sentence overview of conditions and strategy
  timeSlots: Array<{
    startTime: string; // "HH:mm" 24-hour
    endTime: string;
    locationDesc: string; // specific spot type/description
    species: string[];
    rigs: string[];
    baits: string[];
    lures: string[];
    strategy: string; // 2-4 sentences of tactical advice
    confidence: number; // 0-10
  }>;
  generalAdvice: string; // 3-5 sentences of overall day strategy
}
\`\`\`

Generate 4–6 time slots covering dawn through dusk. Make location descriptions specific to inshore structure types relevant to the region. Be specific with rig and lure names — no generic "soft plastic", say "Z-Man 3\" Swimmerz in Junebug on 1/4 oz jig head." Confidence scores should reflect tide stage, solunar alignment, and wind conditions.

Return ONLY the JSON object, no markdown fences, no extra text.`;
}

/**
 * Call the Claude API to generate a fishing plan.
 * Uses streaming fetch to handle long responses.
 */
export async function generateFishingPlan(
  params: FishingPlanParams,
  apiKey: string,
  onProgress?: (chunk: string) => void
): Promise<FishingPlan> {
  if (!apiKey) {
    throw new Error('Claude API key is not configured. Add it in Settings.');
  }

  const prompt = buildPrompt(params);

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      stream: true,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errorText}`);
  }

  if (!response.body) {
    throw new Error('No response body from Claude API');
  }

  // Read the SSE stream
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;

      try {
        const event = JSON.parse(data);
        if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
          const chunk: string = event.delta.text ?? '';
          fullText += chunk;
          onProgress?.(chunk);
        }
      } catch {
        // Skip malformed SSE events
      }
    }
  }

  // Parse the JSON response
  const jsonText = fullText.trim();
  try {
    const plan = JSON.parse(jsonText) as FishingPlan;
    // Ensure required fields
    if (!plan.timeSlots || !Array.isArray(plan.timeSlots)) {
      throw new Error('Invalid plan structure: missing timeSlots array');
    }
    return plan;
  } catch (e) {
    // Try to extract JSON if wrapped in any stray text
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as FishingPlan;
    }
    throw new Error(`Failed to parse Claude response as JSON: ${e}`);
  }
}
