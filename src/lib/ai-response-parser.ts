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

// Day Plan specific interfaces
export interface ParsedTimeBlock {
  time: string;
  title: string;
  emoji: string;
  category: string;
  duration: string;
  cost: string;
  location: string;
  transport: string;
  tips: string[];
  warnings: string[];
  description: string;
  rawSection: string;
}

export interface ParsedDay {
  dayName: string;
  title: string;
  emoji: string;
  timeBlocks: ParsedTimeBlock[];
}

export interface ParsedDayPlan {
  intro: string;
  days: ParsedDay[];
  generalTips: string[];
  rawResponse: string;
}

/**
 * Detect if response is a day plan or activities list
 */
export function detectResponseType(response: string): 'day_plan' | 'activities' | 'general' {
  if (!response) return 'general';
  
  // Day plan patterns: ## Day: Title or time patterns with multiple occurrences
  const hasDayHeaders = /##\s*(Freitag|Samstag|Sonntag|Montag|Dienstag|Mittwoch|Donnerstag|Friday|Saturday|Sunday|Monday|Tuesday|Wednesday|Thursday|Tag\s*\d|Day\s*\d|Jour|Día|Giorno|Dag|Dzień|Gün|يوم)/i.test(response);
  const timeBlockCount = (response.match(/\d{1,2}:\d{2}\s*(Uhr|AM|PM|h)?/g) || []).length;
  
  if (hasDayHeaders && timeBlockCount >= 3) return 'day_plan';
  
  // Activity patterns: ### Emoji Title with metadata
  const activityHeaders = (response.match(/###\s*[\p{Emoji}\u{1F300}-\u{1F9FF}]/gu) || []).length;
  if (activityHeaders >= 2) return 'activities';
  
  return 'general';
}

/**
 * Parse day plan response into structured data
 */
export function parseDayPlan(response: string): ParsedDayPlan {
  const result: ParsedDayPlan = {
    intro: '',
    days: [],
    generalTips: [],
    rawResponse: response,
  };

  if (!response) return result;

  // Split by day headers (## Day: Title)
  const dayPattern = /##\s*([^:\n]+):?\s*([^\n]*)/g;
  const daySections = response.split(/(?=##\s*(?:Freitag|Samstag|Sonntag|Montag|Dienstag|Mittwoch|Donnerstag|Friday|Saturday|Sunday|Monday|Tuesday|Wednesday|Thursday|Tag\s*\d|Day\s*\d|Jour|Día|Giorno|Dag|Dzień|Gün|يوم)[^#]*)/i);

  // First section is intro
  if (daySections.length > 0 && !daySections[0].match(/^##/)) {
    result.intro = daySections[0].trim();
    daySections.shift();
  }

  // Parse each day
  for (const daySection of daySections) {
    if (!daySection.trim()) continue;

    const day = parseDaySection(daySection);
    if (day && day.timeBlocks.length > 0) {
      result.days.push(day);
    }
  }

  // Extract general tips
  const tipMatches = response.match(/💡[^\n]+|(?:Budget-?)?[Tt]ipp?:?[^\n]+/g);
  if (tipMatches) {
    result.generalTips = tipMatches.slice(0, 5).map(t => t.trim());
  }

  return result;
}

function parseDaySection(section: string): ParsedDay | null {
  const lines = section.split('\n');
  if (lines.length === 0) return null;

  // Parse day header: ## Friday: Welcome & Arrival! 🎉
  const headerMatch = lines[0].match(/##\s*([^:]+):?\s*(.*)/);
  if (!headerMatch) return null;

  const dayName = headerMatch[1].trim();
  const titleWithEmoji = headerMatch[2].trim();
  
  // Extract emojis from title
  const emojiMatch = titleWithEmoji.match(/([\p{Emoji}\u{1F300}-\u{1F9FF}]+)/gu);
  const emoji = emojiMatch ? emojiMatch.join('') : '📅';
  const title = titleWithEmoji.replace(/([\p{Emoji}\u{1F300}-\u{1F9FF}]+)/gu, '').trim();

  const day: ParsedDay = {
    dayName,
    title: title || dayName,
    emoji,
    timeBlocks: [],
  };

  // Parse time blocks
  const timeBlockPattern = /###?\s*(\d{1,2}:\d{2})\s*(Uhr|AM|PM|h)?\s*(?:–|-|bis|to)?\s*(?:\d{1,2}:\d{2}\s*(?:Uhr|AM|PM|h)?)?\s*([\p{Emoji}\u{1F300}-\u{1F9FF}]?)\s*(.+?)(?=###?\s*\d{1,2}:\d{2}|$)/guis;
  
  let blockMatch;
  const sectionContent = section.slice(lines[0].length);
  
  // Alternative parsing: look for time patterns at start of lines
  const timeLinePattern = /^\*?\*?\s*(\d{1,2}:\d{2})\s*(Uhr|AM|PM|h)?:?\s*\*?\*?\s*([\p{Emoji}\u{1F300}-\u{1F9FF}]?)\s*\*?\*?([^*\n]+)\*?\*?/gum;
  
  let lastIndex = 0;
  const matches: { time: string; emoji: string; title: string; startIdx: number; endIdx: number }[] = [];
  
  while ((blockMatch = timeLinePattern.exec(sectionContent)) !== null) {
    matches.push({
      time: blockMatch[1] + (blockMatch[2] ? ` ${blockMatch[2]}` : ''),
      emoji: blockMatch[3] || '📍',
      title: blockMatch[4].trim().replace(/\*\*/g, ''),
      startIdx: blockMatch.index,
      endIdx: blockMatch.index + blockMatch[0].length,
    });
  }

  // Parse content between time blocks
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const nextMatch = matches[i + 1];
    const endIdx = nextMatch ? nextMatch.startIdx : sectionContent.length;
    const content = sectionContent.slice(match.endIdx, endIdx);

    const timeBlock = parseTimeBlockContent(match.time, match.emoji, match.title, content);
    day.timeBlocks.push(timeBlock);
  }

  return day;
}

function parseTimeBlockContent(time: string, emoji: string, title: string, content: string): ParsedTimeBlock {
  const block: ParsedTimeBlock = {
    time,
    title,
    emoji: emoji || '📍',
    category: 'other',
    duration: '',
    cost: '',
    location: '',
    transport: '',
    tips: [],
    warnings: [],
    description: '',
    rawSection: content,
  };

  const lines = content.split('\n').filter(l => l.trim());

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Transport
    if (trimmedLine.match(/🚗|🚕|🚌|🚇|Transport/i)) {
      block.transport = trimmedLine.replace(/^[\s*-]*🚗?\s*Transport:?\s*/i, '').trim();
      continue;
    }

    // Location
    if (trimmedLine.match(/📍|Ort:|Location:|Place:/i)) {
      block.location = trimmedLine.replace(/^[\s*-]*📍?\s*(?:Ort|Location|Place):?\s*/i, '').trim();
      continue;
    }

    // Restaurant/Food
    if (trimmedLine.match(/🍽️|Restaurant|Food:/i)) {
      block.location = block.location || trimmedLine.replace(/^[\s*-]*🍽️?\s*(?:Restaurant|Food):?\s*/i, '').trim();
      block.category = 'food';
      continue;
    }

    // Tips
    if (trimmedLine.match(/💡|Pro-?Tipp?|Tip:|Hint:/i)) {
      block.tips.push(trimmedLine.replace(/^[\s*-]*💡?\s*(?:Pro-?Tipp?|Tip|Hint):?\s*/i, '').trim());
      continue;
    }

    // Warnings
    if (trimmedLine.match(/⚠️|Wichtig|Warning|Achtung|Important/i)) {
      block.warnings.push(trimmedLine.replace(/^[\s*-]*⚠️?\s*(?:Wichtig|Warning|Achtung|Important):?\s*/i, '').trim());
      continue;
    }

    // Cost
    if (trimmedLine.match(/💰|€|\$|Kosten|Cost|Price/i)) {
      const costMatch = trimmedLine.match(/(?:€|\$|USD|EUR)?\s*(\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?)/);
      if (costMatch) {
        block.cost = trimmedLine.replace(/^[\s*-]*💰?\s*(?:Kosten|Cost|Price):?\s*/i, '').trim();
      }
      continue;
    }

    // Category detection from content
    if (trimmedLine.match(/🏨|Hotel|Unterkunft|Accommodation/i)) {
      block.category = 'accommodation';
    } else if (trimmedLine.match(/🎲|Casino|Spielen|Gaming/i)) {
      block.category = 'activity';
    } else if (trimmedLine.match(/🎭|Show|Theater|Concert/i)) {
      block.category = 'activity';
    } else if (trimmedLine.match(/🍻|Bar|Club|Party/i)) {
      block.category = 'party';
    } else if (trimmedLine.match(/✈️|Flug|Flight|Airport/i)) {
      block.category = 'transport';
    }

    // Add to description
    if (trimmedLine && !trimmedLine.startsWith('---')) {
      block.description += (block.description ? '\n' : '') + trimmedLine;
    }
  }

  // Infer category from emoji if not set
  if (block.category === 'other') {
    const categoryFromEmoji: Record<string, string> = {
      '✈️': 'transport', '🚗': 'transport', '🚌': 'transport', '🚇': 'transport',
      '🏨': 'accommodation', '🛏️': 'accommodation',
      '🍽️': 'food', '🍕': 'food', '🍻': 'food', '☕': 'food',
      '🎲': 'activity', '🎯': 'activity', '🎭': 'activity', '🎡': 'activity',
      '🎉': 'party', '💃': 'party', '🥂': 'party',
      '🏛️': 'sightseeing', '📸': 'sightseeing', '🗺️': 'sightseeing',
      '💆': 'relaxation', '🧘': 'relaxation', '🏊': 'relaxation',
    };
    block.category = categoryFromEmoji[emoji] || 'other';
  }

  return block;
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

/**
 * Convert a time block to schedule activity format
 */
export function timeBlockToScheduleData(timeBlock: ParsedTimeBlock) {
  // Parse cost to number
  let estimatedCost: number | null = null;
  const costMatch = timeBlock.cost.match(/(\d+)/);
  if (costMatch) {
    estimatedCost = parseInt(costMatch[1], 10);
  }

  return {
    title: timeBlock.title,
    description: timeBlock.description,
    category: timeBlock.category,
    start_time: timeBlock.time.replace(/\s*(Uhr|AM|PM|h)/i, '').trim(),
    location: timeBlock.location,
    estimated_cost: estimatedCost,
    cost_per_person: true,
    notes: [
      timeBlock.transport && `🚗 ${timeBlock.transport}`,
      ...timeBlock.tips.map(t => `💡 ${t}`),
      ...timeBlock.warnings.map(w => `⚠️ ${w}`),
    ].filter(Boolean).join('\n'),
  };
}
