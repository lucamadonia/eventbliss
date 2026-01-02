// AI Response Parser - Extracts structured activity data from AI responses

export interface ParsedActivity {
  emoji: string;
  title: string;
  category: string;
  duration: string;
  cost: string;
  fitness: 'easy' | 'normal' | 'challenging';
  description: string;
  rawSection: string;
}

export interface ParsedAIResponse {
  intro: string;
  activities: ParsedActivity[];
  tips: string[];
  rawResponse: string;
}

/**
 * Parse structured AI response into components
 * The AI is prompted to use a specific format:
 * ### [Emoji] Activity Name
 * - **Kategorie:** category
 * - **Dauer:** duration
 * - **Kosten:** cost
 * - **Fitness:** level
 * 
 * Description text
 */
export function parseAIResponse(response: string): ParsedAIResponse {
  const result: ParsedAIResponse = {
    intro: '',
    activities: [],
    tips: [],
    rawResponse: response,
  };

  if (!response) return result;

  // Split by activity headers (### with emoji)
  const activityRegex = /###\s*([^\n]+)/g;
  const sections = response.split(/(?=###\s*[^\n]+)/);

  // First section before any ### is the intro
  if (sections.length > 0 && !sections[0].startsWith('###')) {
    result.intro = sections[0].trim();
    sections.shift();
  }

  // Parse each activity section
  for (const section of sections) {
    if (!section.trim()) continue;

    const activity = parseActivitySection(section);
    if (activity) {
      result.activities.push(activity);
    }
  }

  // Extract tips (lines starting with 💡 or containing "Tipp" / "Tip")
  const tipMatches = response.match(/💡[^\n]+|(?:Budget-?)?[Tt]ipp?:?[^\n]+/g);
  if (tipMatches) {
    result.tips = tipMatches.map(t => t.trim());
  }

  return result;
}

function parseActivitySection(section: string): ParsedActivity | null {
  const lines = section.split('\n').filter(l => l.trim());
  if (lines.length === 0) return null;

  // Parse header: ### [Emoji] Title
  const headerMatch = lines[0].match(/###\s*(\p{Emoji}|\p{Emoji_Presentation}|[\u{1F300}-\u{1F9FF}]|[🎉🎯🏎️🚁💆🍹🎭📸🎲⚽🏊🧘🍕🎤🎸🏖️⛰️🌊🏞️🍷🍻🎰🪂🚣🧗🥾🚵])\s*(.+)/u);
  
  if (!headerMatch) {
    // Fallback: try simpler pattern
    const simpleMatch = lines[0].match(/###\s*(.+)/);
    if (!simpleMatch) return null;
    
    const title = simpleMatch[1].trim();
    const emojiFromTitle = title.match(/^(\p{Emoji}|\p{Emoji_Presentation}|[\u{1F300}-\u{1F9FF}])\s*/u);
    
    return {
      emoji: emojiFromTitle ? emojiFromTitle[1] : '🎯',
      title: emojiFromTitle ? title.replace(emojiFromTitle[0], '').trim() : title,
      category: 'other',
      duration: '',
      cost: '',
      fitness: 'normal',
      description: lines.slice(1).join('\n').trim(),
      rawSection: section,
    };
  }

  const emoji = headerMatch[1];
  const title = headerMatch[2].trim();

  // Parse metadata lines
  let category = 'other';
  let duration = '';
  let cost = '';
  let fitness: 'easy' | 'normal' | 'challenging' = 'normal';
  const descriptionLines: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Parse category
    const categoryMatch = line.match(/\*\*(?:Kategorie|Category)\*\*:?\s*(.+)/i);
    if (categoryMatch) {
      category = categoryMatch[1].toLowerCase().trim();
      continue;
    }

    // Parse duration
    const durationMatch = line.match(/(?:⏱️|\*\*(?:Dauer|Duration)\*\*):?\s*(.+)/i);
    if (durationMatch) {
      duration = durationMatch[1].trim();
      continue;
    }

    // Parse cost
    const costMatch = line.match(/(?:💰|\*\*(?:Kosten|Cost|Preis|Price)\*\*):?\s*(.+)/i);
    if (costMatch) {
      cost = costMatch[1].trim();
      continue;
    }

    // Parse fitness
    const fitnessMatch = line.match(/(?:💪|\*\*(?:Fitness|Anforderung|Requirement)\*\*):?\s*(.+)/i);
    if (fitnessMatch) {
      const level = fitnessMatch[1].toLowerCase().trim();
      if (level.includes('leicht') || level.includes('easy') || level.includes('gering')) {
        fitness = 'easy';
      } else if (level.includes('anspruch') || level.includes('challeng') || level.includes('hoch') || level.includes('sportlich')) {
        fitness = 'challenging';
      } else {
        fitness = 'normal';
      }
      continue;
    }

    // Skip bullet points that are metadata
    if (line.startsWith('- **') || line.startsWith('* **')) {
      continue;
    }

    // Everything else is description
    if (line && !line.startsWith('---')) {
      descriptionLines.push(line);
    }
  }

  return {
    emoji,
    title,
    category,
    duration,
    cost,
    fitness,
    description: descriptionLines.join('\n').trim(),
    rawSection: section,
  };
}

/**
 * Convert a parsed activity to schedule activity format
 */
export function activityToScheduleData(activity: ParsedActivity) {
  // Parse cost to number
  let estimatedCost: number | null = null;
  const costMatch = activity.cost.match(/(\d+)/);
  if (costMatch) {
    estimatedCost = parseInt(costMatch[1], 10);
  }

  // Map category to schedule category
  const categoryMap: Record<string, string> = {
    'action': 'activity',
    'outdoor': 'activity',
    'food': 'food',
    'drinks': 'food',
    'chill': 'relaxation',
    'relaxation': 'relaxation',
    'wellness': 'relaxation',
    'transport': 'transport',
    'party': 'party',
    'sightseeing': 'sightseeing',
    'accommodation': 'accommodation',
  };

  return {
    title: activity.title,
    description: activity.description,
    category: categoryMap[activity.category] || 'other',
    estimated_cost: estimatedCost,
    cost_per_person: true,
    notes: `Empfohlen von KI-Assistent • ${activity.duration}`,
  };
}
