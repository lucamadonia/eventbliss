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
  
  // Day plan patterns - support multiple formats
  // Pattern 1: ## Day: Title (structured format)
  const hasStructuredDayHeaders = /##\s*(Freitag|Samstag|Sonntag|Montag|Dienstag|Mittwoch|Donnerstag|Friday|Saturday|Sunday|Monday|Tuesday|Wednesday|Thursday|Tag\s*\d|Day\s*\d|Jour|Día|Giorno|Dag|Dzień|Gün|يوم)/i.test(response);
  
  // Pattern 2: **Day:** Title (bold format the AI sometimes uses)
  const hasBoldDayHeaders = /\*\*\s*(Freitag|Samstag|Sonntag|Montag|Dienstag|Mittwoch|Donnerstag|Friday|Saturday|Sunday|Monday|Tuesday|Wednesday|Thursday|Tag\s*\d|Day\s*\d)[:\s]/i.test(response);
  
  // Count time patterns
  const timeBlockCount = (response.match(/\d{1,2}:\d{2}\s*(Uhr|AM|PM|h)?/g) || []).length;
  
  if ((hasStructuredDayHeaders || hasBoldDayHeaders) && timeBlockCount >= 3) return 'day_plan';
  
  // Activity patterns: ### Emoji Title with metadata
  const activityHeaders = (response.match(/###\s*[\p{Emoji}\u{1F300}-\u{1F9FF}]/gu) || []).length;
  if (activityHeaders >= 2) return 'activities';
  
  return 'general';
}

/**
 * Parse day plan response into structured data
 * Supports multiple formats:
 * 1. ## Day: Title (structured)
 * 2. **Day:** Title (bold)
 */
export function parseDayPlan(response: string): ParsedDayPlan {
  const result: ParsedDayPlan = {
    intro: '',
    days: [],
    generalTips: [],
    rawResponse: response,
  };

  if (!response) return result;

  // Try to split by different day header patterns
  // Pattern 1: ## Day (structured markdown)
  // Pattern 2: **Day:** (bold format)
  const dayPatterns = [
    /(?=##\s*(?:Freitag|Samstag|Sonntag|Montag|Dienstag|Mittwoch|Donnerstag|Friday|Saturday|Sunday|Monday|Tuesday|Wednesday|Thursday|Tag\s*\d|Day\s*\d)[^#]*)/gi,
    /(?=\*\*\s*(?:Freitag|Samstag|Sonntag|Montag|Dienstag|Mittwoch|Donnerstag|Friday|Saturday|Sunday|Monday|Tuesday|Wednesday|Thursday|Tag\s*\d|Day\s*\d)[:\s][^*]*)/gi,
  ];

  let daySections: string[] = [];
  
  // Try structured format first
  const structuredSections = response.split(dayPatterns[0]).filter(s => s.trim());
  if (structuredSections.length > 1) {
    daySections = structuredSections;
  } else {
    // Try bold format
    const boldSections = response.split(dayPatterns[1]).filter(s => s.trim());
    if (boldSections.length > 1) {
      daySections = boldSections;
    }
  }

  // If no day sections found, try finding time blocks directly
  if (daySections.length === 0) {
    const hasTimeBlocks = response.match(/\d{1,2}:\d{2}\s*(Uhr|AM|PM|h)?/g);
    if (hasTimeBlocks && hasTimeBlocks.length >= 3) {
      // Treat entire response as single day
      daySections = [response];
    }
  }

  // Extract intro (content before first day)
  if (daySections.length > 0) {
    const firstDayStart = response.indexOf(daySections[0]);
    if (firstDayStart > 0) {
      result.intro = response.slice(0, firstDayStart).trim();
    }
  }

  // Parse each day section
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
  const lines = section.split('\n').filter(l => l.trim());
  if (lines.length === 0) return null;

  // Try multiple header patterns
  let dayName = '';
  let titleWithEmoji = '';
  let headerLineIndex = 0;

  // Pattern 1: ## Friday: Welcome & Arrival! 🎉
  const structuredMatch = lines[0].match(/##\s*([^:]+):?\s*(.*)/);
  // Pattern 2: **Friday:** Welcome & Arrival! 🎉
  const boldMatch = lines[0].match(/\*\*\s*([^:*]+)[:\s]*\*\*\s*(.*)/);
  // Pattern 3: **Friday: Welcome & Arrival! 🎉**
  const boldMatch2 = lines[0].match(/\*\*\s*([^:]+):\s*([^*]+)\*\*/);
  
  if (structuredMatch) {
    dayName = structuredMatch[1].trim();
    titleWithEmoji = structuredMatch[2].trim();
  } else if (boldMatch) {
    dayName = boldMatch[1].trim();
    titleWithEmoji = boldMatch[2].trim();
  } else if (boldMatch2) {
    dayName = boldMatch2[1].trim();
    titleWithEmoji = boldMatch2[2].trim();
  } else {
    // Try to find day name in first few lines
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const dayNameMatch = lines[i].match(/(Freitag|Samstag|Sonntag|Montag|Dienstag|Mittwoch|Donnerstag|Friday|Saturday|Sunday|Monday|Tuesday|Wednesday|Thursday)/i);
      if (dayNameMatch) {
        dayName = dayNameMatch[1];
        titleWithEmoji = lines[i].replace(dayNameMatch[0], '').replace(/[*#:]/g, '').trim();
        headerLineIndex = i;
        break;
      }
    }
  }

  if (!dayName) {
    // Fallback: use "Tag 1" if we have time blocks
    const hasTimeBlocks = section.match(/\d{1,2}:\d{2}/);
    if (hasTimeBlocks) {
      dayName = 'Tagesplan';
    } else {
      return null;
    }
  }

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

  // Get content after header
  const sectionContent = lines.slice(headerLineIndex + 1).join('\n');

  // Find all time blocks using multiple patterns
  const timeMatches: { time: string; emoji: string; title: string; startIdx: number; content: string }[] = [];
  
  // Split by time patterns and extract blocks
  // Pattern: **17:00 Uhr:** **Title** or * **17:00 Uhr:** **Title** or ### 17:00 🎯 Title
  const timeRegex = /(?:^|\n)\s*(?:\*\s*)?\*?\*?\s*(\d{1,2}:\d{2})\s*(Uhr|AM|PM|h)?[:\s]*\*?\*?\s*([\p{Emoji}\u{1F300}-\u{1F9FF}]?)\s*\*?\*?([^*\n]+?)(?:\*\*)?(?=\n|$)/gmu;
  
  let match;
  const allMatches: { time: string; emoji: string; title: string; idx: number }[] = [];
  
  while ((match = timeRegex.exec(sectionContent)) !== null) {
    allMatches.push({
      time: match[1] + (match[2] ? ` ${match[2]}` : ''),
      emoji: match[3] || '📍',
      title: match[4].trim().replace(/\*\*/g, ''),
      idx: match.index,
    });
  }

  // Extract content between time blocks
  for (let i = 0; i < allMatches.length; i++) {
    const current = allMatches[i];
    const next = allMatches[i + 1];
    
    // Find the end of current block's header line
    const headerEndIdx = sectionContent.indexOf('\n', current.idx);
    const contentStart = headerEndIdx !== -1 ? headerEndIdx : current.idx + 50;
    const contentEnd = next ? next.idx : sectionContent.length;
    
    const content = sectionContent.slice(contentStart, contentEnd).trim();
    
    const timeBlock = parseTimeBlockContent(current.time, current.emoji, current.title, content);
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
