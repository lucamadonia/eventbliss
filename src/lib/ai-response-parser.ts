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

// Extended Activity interface for premium cards
export interface ParsedActivityExtended extends ParsedActivity {
  number: number;
  location?: string;
  highlights: string[];
  requirements?: string[];
}

export interface ParsedActivitiesResponse {
  intro: string;
  activities: ParsedActivityExtended[];
  tips: string[];
  rawResponse: string;
}

// Trip Ideas interfaces
export interface ParsedTripIdea {
  number: number;
  emoji: string;
  title: string;
  destination: string;
  cost: string;
  travelTime?: string;
  whyPerfect: string[];
  description: string;
  highlights: string[];
}

export interface ParsedTripIdeasResponse {
  intro: string;
  ideas: ParsedTripIdea[];
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

// All day names we recognize across supported languages
const DAY_NAMES_PATTERN = '(?:Freitag|Samstag|Sonntag|Montag|Dienstag|Mittwoch|Donnerstag|Friday|Saturday|Sunday|Monday|Tuesday|Wednesday|Thursday|Vendredi|Samedi|Dimanche|Lundi|Mardi|Mercredi|Jeudi|Viernes|Sábado|Domingo|Lunes|Martes|Miércoles|Jueves|Venerdì|Sabato|Domenica|Lunedì|Martedì|Mercoledì|Giovedì|Vrijdag|Zaterdag|Zondag|Maandag|Dinsdag|Woensdag|Donderdag|Piątek|Sobota|Niedziela|Poniedziałek|Wtorek|Środa|Czwartek|Sexta|Sábado|Domingo|Segunda|Terça|Quarta|Quinta|Cuma|Cumartesi|Pazar|Pazartesi|Salı|Çarşamba|Perşembe|الجمعة|السبت|الأحد|الاثنين|الثلاثاء|الأربعاء|الخميس|Tag\\s*\\d|Day\\s*\\d|Jour\\s*\\d|Día\\s*\\d|Giorno\\s*\\d|Dag\\s*\\d|Dzień\\s*\\d|Gün\\s*\\d|يوم\\s*\\d)';

interface DayHeader {
  dayName: string;
  title: string;
  startIdx: number;
  endIdx: number;
}

/**
 * Find all day headers in the response with their positions
 */
function findDayHeaders(response: string): DayHeader[] {
  const headers: DayHeader[] = [];
  
  // Different patterns the AI might use for day headers
  const patterns = [
    // Pattern 1: ## Freitag: Titel 🎉
    new RegExp(`^##\\s*(${DAY_NAMES_PATTERN})[:\\s]+([^\\n]*)`, 'gim'),
    // Pattern 2: **Freitag: Titel 🎉** (bold block)
    new RegExp(`^\\*\\*\\s*(${DAY_NAMES_PATTERN})[:\\s]+([^*]+)\\*\\*`, 'gim'),
    // Pattern 3: **Freitag:** Titel (bold day name only)
    new RegExp(`^\\*\\*\\s*(${DAY_NAMES_PATTERN})\\s*\\*\\*[:\\s]+([^\\n]*)`, 'gim'),
    // Pattern 4: ### Freitag: Titel (heading level 3)
    new RegExp(`^###\\s*(${DAY_NAMES_PATTERN})[:\\s]+([^\\n]*)`, 'gim'),
    // Pattern 5: Plain text at line start: Freitag: Titel (only if followed by time blocks)
    new RegExp(`^(${DAY_NAMES_PATTERN})[:\\s]+([^\\n]{3,})`, 'gim'),
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(response)) !== null) {
      // Check if we already have a header at this position (within 5 chars)
      const alreadyFound = headers.some(h => Math.abs(h.startIdx - match!.index) < 5);
      if (!alreadyFound) {
        headers.push({
          dayName: match[1].trim(),
          title: match[2] ? match[2].replace(/\*\*/g, '').trim() : '',
          startIdx: match.index,
          endIdx: match.index + match[0].length,
        });
      }
    }
  }

  // Sort by position
  headers.sort((a, b) => a.startIdx - b.startIdx);

  // Remove duplicates (keep first occurrence)
  const uniqueHeaders: DayHeader[] = [];
  for (const header of headers) {
    const isDuplicate = uniqueHeaders.some(h => 
      h.dayName.toLowerCase() === header.dayName.toLowerCase() && 
      Math.abs(h.startIdx - header.startIdx) < 50
    );
    if (!isDuplicate) {
      uniqueHeaders.push(header);
    }
  }

  return uniqueHeaders;
}

/**
 * Parse day plan response into structured data
 * Supports multiple formats:
 * 1. ## Day: Title (structured)
 * 2. **Day:** Title (bold)
 * 3. **Day: Title** (bold block)
 * 4. Day: Title (plain)
 */
/**
 * NEW LINE-BY-LINE PARSER - More robust day detection
 * Handles AI output variations by detecting day headers and time blocks line by line
 */
export function parseDayPlan(response: string): ParsedDayPlan {
  const result: ParsedDayPlan = {
    intro: '',
    days: [],
    generalTips: [],
    rawResponse: response,
  };

  if (!response) return result;

  const lines = response.split('\n');
  let currentDay: ParsedDay | null = null;
  let currentTimeBlock: ParsedTimeBlock | null = null;
  let introLines: string[] = [];
  let foundFirstDay = false;
  let dayCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Skip empty lines
    if (!trimmed) continue;

    // Try to match a day header
    const dayMatch = matchDayHeader(trimmed);
    if (dayMatch) {
      // Save previous day if exists
      if (currentDay) {
        if (currentTimeBlock) {
          currentDay.timeBlocks.push(currentTimeBlock);
          currentTimeBlock = null;
        }
        if (currentDay.timeBlocks.length > 0) {
          result.days.push(currentDay);
        }
      }

      dayCounter++;
      currentDay = {
        dayName: dayMatch.dayName,
        title: dayMatch.title,
        emoji: dayMatch.emoji,
        timeBlocks: [],
      };
      foundFirstDay = true;
      continue;
    }

    // Try to match a time block header
    const timeMatch = matchTimeBlockHeader(trimmed);
    if (timeMatch) {
      // If no current day, create one
      if (!currentDay && foundFirstDay === false) {
        dayCounter++;
        currentDay = {
          dayName: `Tag ${dayCounter}`,
          title: '',
          emoji: '📅',
          timeBlocks: [],
        };
        foundFirstDay = true;
      }
      
      if (currentDay) {
        // Save previous time block
        if (currentTimeBlock) {
          currentDay.timeBlocks.push(currentTimeBlock);
        }

        currentTimeBlock = {
          time: timeMatch.time,
          title: timeMatch.title,
          emoji: timeMatch.emoji,
          category: inferCategoryFromEmoji(timeMatch.emoji),
          duration: '',
          cost: '',
          location: '',
          transport: '',
          tips: [],
          warnings: [],
          description: '',
          rawSection: '',
        };
      }
      continue;
    }

    // Parse content lines (belong to current time block or intro)
    if (currentTimeBlock) {
      parseContentLine(trimmed, currentTimeBlock);
    } else if (!foundFirstDay) {
      // Before first day - this is intro
      introLines.push(trimmed);
    }
  }

  // Save last time block and day
  if (currentTimeBlock && currentDay) {
    currentDay.timeBlocks.push(currentTimeBlock);
  }
  if (currentDay && currentDay.timeBlocks.length > 0) {
    result.days.push(currentDay);
  }

  // Set intro
  result.intro = introLines.join('\n').replace(/^#+\s*/, '').trim();

  // If still no days but have time blocks in intro, create a fallback
  if (result.days.length === 0) {
    // Try legacy parsing
    const legacyResult = legacyParseDayPlan(response);
    if (legacyResult.days.length > 0) {
      return legacyResult;
    }
  }

  // Extract general tips from entire response
  const tipMatches = response.match(/💡[^\n]+|(?:Budget-?)?[Tt]ipp?:?[^\n]+/g);
  if (tipMatches) {
    result.generalTips = tipMatches.slice(0, 5).map(t => t.trim());
  }

  console.log('=== Day Plan Parser (Line-by-Line) ===');
  console.log('Total days found:', result.days.length);
  result.days.forEach((d, i) => console.log(`- TAG ${i + 1}: ${d.dayName} (${d.timeBlocks.length} blocks)`));

  return result;
}

/**
 * Match day header in various formats
 */
function matchDayHeader(line: string): { dayName: string; title: string; emoji: string } | null {
  // All day name patterns
  const dayNamePattern = '(Freitag|Samstag|Sonntag|Montag|Dienstag|Mittwoch|Donnerstag|Friday|Saturday|Sunday|Monday|Tuesday|Wednesday|Thursday|Vendredi|Samedi|Dimanche|Viernes|Sábado|Domingo|Tag\\s*\\d+|Day\\s*\\d+|Jour\\s*\\d+|Día\\s*\\d+|Giorno\\s*\\d+)';
  
  const patterns = [
    // ## Freitag: Ankunft & Welcome! ✈️🌃
    new RegExp(`^##\\s*${dayNamePattern}[:\\s]+(.*)`, 'i'),
    // ### Freitag: Ankunft
    new RegExp(`^###\\s*${dayNamePattern}[:\\s]+(.*)`, 'i'),
    // **Freitag: Ankunft & Welcome! ✈️🌃**
    new RegExp(`^\\*\\*\\s*${dayNamePattern}[:\\s]+([^*]+)\\*\\*`, 'i'),
    // **Freitag:** Ankunft
    new RegExp(`^\\*\\*\\s*${dayNamePattern}\\s*\\*\\*[:\\s]+(.*)`, 'i'),
    // Freitag: Ankunft (plain, at line start, with enough content)
    new RegExp(`^${dayNamePattern}[:\\s]+(.{5,})`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      const title = match[2] ? match[2].replace(/\*\*/g, '').trim() : '';
      const emojiMatch = title.match(/([\p{Emoji}\u{1F300}-\u{1F9FF}]+)/gu);
      return {
        dayName: match[1].trim(),
        title: title.replace(/([\p{Emoji}\u{1F300}-\u{1F9FF}]+)/gu, '').trim(),
        emoji: emojiMatch ? emojiMatch.join('') : '📅',
      };
    }
  }

  return null;
}

/**
 * Match time block header in various formats
 */
function matchTimeBlockHeader(line: string): { time: string; title: string; emoji: string } | null {
  const patterns = [
    // ### 17:00 ✈️ Ankunft am Flughafen
    /^###\s*(\d{1,2}:\d{2})\s*(Uhr|AM|PM|h)?\s*([\p{Emoji}\u{1F300}-\u{1F9FF}]?)\s*(.+)/u,
    // **17:00 Uhr:** **Ankunft am Flughafen**
    /^\*\*\s*(\d{1,2}:\d{2})\s*(Uhr|AM|PM|h)?[:\s]*\*\*\s*\*?\*?([^\*]+)\*?\*?/u,
    // * **17:00 Uhr:** **Ankunft**
    /^\*\s*\*\*\s*(\d{1,2}:\d{2})\s*(Uhr|AM|PM|h)?[:\s]*\*\*\s*\*?\*?([^\*]+)\*?\*?/u,
    // **17:00** Ankunft
    /^\*\*(\d{1,2}:\d{2})\s*(Uhr|AM|PM|h)?\*\*[:\s]*(.+)/u,
    // 17:00 - Ankunft (with dash separator)
    /^(\d{1,2}:\d{2})\s*(Uhr|AM|PM|h)?\s*[-–—]\s*(.+)/u,
    // 17:00 ✈️ Ankunft (plain with emoji)
    /^(\d{1,2}:\d{2})\s*(Uhr|AM|PM|h)?\s*([\p{Emoji}\u{1F300}-\u{1F9FF}])\s*(.+)/u,
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      const time = match[1] + (match[2] ? ` ${match[2]}` : '');
      let title = '';
      let emoji = '📍';

      if (match.length === 5) {
        // Pattern with separate emoji capture
        emoji = match[3] || '📍';
        title = match[4].replace(/\*\*/g, '').trim();
      } else {
        // Pattern with title only
        title = match[3].replace(/\*\*/g, '').trim();
        const titleEmojiMatch = title.match(/^([\p{Emoji}\u{1F300}-\u{1F9FF}])\s*/u);
        if (titleEmojiMatch) {
          emoji = titleEmojiMatch[1];
          title = title.replace(titleEmojiMatch[0], '').trim();
        }
      }

      return { time, title, emoji };
    }
  }

  return null;
}

/**
 * Parse content lines into time block properties
 */
function parseContentLine(line: string, block: ParsedTimeBlock): void {
  const trimmed = line.trim();
  
  // Skip separators
  if (trimmed.startsWith('---')) return;

  // Location: 📍 Ort: Place or 📍 Location: Place
  if (/^📍|^Ort:|^Location:|^Place:|^Lieu:|^Lugar:|^Luogo:/i.test(trimmed)) {
    block.location = trimmed.replace(/^📍?\s*(?:Ort|Location|Place|Lieu|Lugar|Luogo)[:\s]*/i, '').trim();
    return;
  }

  // Transport: 🚗 Transport: Details
  if (/^🚗|^🚕|^🚌|^🚇|^Transport/i.test(trimmed)) {
    block.transport = trimmed.replace(/^[\s🚗🚕🚌🚇]*(?:Transport)[:\s]*/i, '').trim();
    return;
  }

  // Cost: 💰 Kosten: ~50€
  if (/^💰|^Kosten:|^Cost:|^Price:|^Coût:|^Costo:/i.test(trimmed)) {
    block.cost = trimmed.replace(/^💰?\s*(?:Kosten|Cost|Price|Coût|Costo)[:\s]*/i, '').trim();
    return;
  }

  // Duration: ⏱️ Dauer: 2 Stunden
  if (/^⏱️|^Dauer:|^Duration:|^Durée:|^Duración:|^Durata:/i.test(trimmed)) {
    block.duration = trimmed.replace(/^⏱️?\s*(?:Dauer|Duration|Durée|Duración|Durata)[:\s]*/i, '').trim();
    return;
  }

  // Tips: 💡 Pro-Tipp: ...
  if (/^💡|^Pro-?Tipp?|^Tip:|^Hint:|^Conseil:/i.test(trimmed)) {
    block.tips.push(trimmed.replace(/^[\s💡]*(?:Pro-?Tipp?|Tip|Hint|Conseil)[:\s]*/i, '').trim());
    return;
  }

  // Warnings: ⚠️ Wichtig: ...
  if (/^⚠️|^Wichtig:|^Warning:|^Achtung:|^Important:/i.test(trimmed)) {
    block.warnings.push(trimmed.replace(/^[\s⚠️]*(?:Wichtig|Warning|Achtung|Important)[:\s]*/i, '').trim());
    return;
  }

  // Restaurant/Food specific
  if (/^🍽️|^Restaurant:|^Food:/i.test(trimmed)) {
    block.location = block.location || trimmed.replace(/^🍽️?\s*(?:Restaurant|Food)[:\s]*/i, '').trim();
    block.category = 'food';
    return;
  }

  // Everything else is description
  if (trimmed && !trimmed.match(/^[-*]+$/)) {
    block.description += (block.description ? '\n' : '') + trimmed;
  }
}

/**
 * Infer category from emoji
 */
function inferCategoryFromEmoji(emoji: string): string {
  const categoryMap: Record<string, string> = {
    '✈️': 'transport', '🚗': 'transport', '🚌': 'transport', '🚇': 'transport', '🚕': 'transport',
    '🏨': 'accommodation', '🛏️': 'accommodation', '🏠': 'accommodation',
    '🍽️': 'food', '🍕': 'food', '🍻': 'food', '☕': 'food', '🍳': 'food', '🥂': 'food',
    '🎲': 'activity', '🎯': 'activity', '🎭': 'activity', '🎡': 'activity', '🎰': 'activity',
    '🎉': 'party', '💃': 'party', '🪩': 'party', '🍺': 'party',
    '🏛️': 'sightseeing', '📸': 'sightseeing', '🗺️': 'sightseeing', '🏔️': 'sightseeing',
    '💆': 'relaxation', '🧘': 'relaxation', '🏊': 'relaxation', '♨️': 'relaxation',
  };
  return categoryMap[emoji] || 'other';
}

/**
 * Legacy parser fallback - used when line-by-line fails
 */
function legacyParseDayPlan(response: string): ParsedDayPlan {
  const result: ParsedDayPlan = {
    intro: '',
    days: [],
    generalTips: [],
    rawResponse: response,
  };

  // Find all day headers with positions
  const headers = findDayHeaders(response);

  if (headers.length > 0) {
    if (headers[0].startIdx > 0) {
      result.intro = response.slice(0, headers[0].startIdx).trim();
    }

    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      const nextHeader = headers[i + 1];
      const contentEnd = nextHeader ? nextHeader.startIdx : response.length;
      const dayContent = response.slice(header.startIdx, contentEnd);

      const day = parseDaySection(dayContent, header.dayName, header.title);
      if (day && day.timeBlocks.length > 0) {
        result.days.push(day);
      }
    }
  } else {
    // Fallback: treat entire response as single day if it has time blocks
    const hasTimeBlocks = response.match(/\d{1,2}:\d{2}\s*(Uhr|AM|PM|h)?/g);
    if (hasTimeBlocks && hasTimeBlocks.length >= 2) {
      const day = parseDaySection(response, 'Tagesplan', '');
      if (day && day.timeBlocks.length > 0) {
        result.days.push(day);
      }
    }
  }

  const tipMatches = response.match(/💡[^\n]+|(?:Budget-?)?[Tt]ipp?:?[^\n]+/g);
  if (tipMatches) {
    result.generalTips = tipMatches.slice(0, 5).map(t => t.trim());
  }

  return result;
}

function parseDaySection(section: string, providedDayName?: string, providedTitle?: string): ParsedDay | null {
  const lines = section.split('\n').filter(l => l.trim());
  if (lines.length === 0) return null;

  // Use provided day name and title if available (from findDayHeaders)
  let dayName = providedDayName || '';
  let titleWithEmoji = providedTitle || '';
  let headerLineIndex = 0;

  // If not provided, try to extract from first line
  if (!dayName) {
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
  }

  if (!dayName) {
    // Fallback: use "Tagesplan" if we have time blocks
    const hasTimeBlocks = section.match(/\d{1,2}:\d{2}/);
    if (hasTimeBlocks) {
      dayName = 'Tagesplan';
    } else {
      return null;
    }
  }

  // Use provided title or extract emojis from titleWithEmoji
  const emojiMatch = titleWithEmoji.match(/([\p{Emoji}\u{1F300}-\u{1F9FF}]+)/gu);
  const emoji = emojiMatch ? emojiMatch.join('') : '📅';
  const title = titleWithEmoji.replace(/([\p{Emoji}\u{1F300}-\u{1F9FF}]+)/gu, '').trim();

  const day: ParsedDay = {
    dayName,
    title: title || dayName,
    emoji,
    timeBlocks: [],
  };

  // Get content after header (skip the header line)
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

/**
 * Parse activities response into structured format for premium display
 */
export function parseActivitiesExtended(response: string): ParsedActivitiesResponse {
  const parsed = parseAIResponse(response);
  
  const activities: ParsedActivityExtended[] = parsed.activities.map((activity, index) => ({
    ...activity,
    number: index + 1,
    location: undefined,
    highlights: [],
  }));

  // Try to extract highlights from descriptions
  activities.forEach(activity => {
    const highlightMatch = activity.description.match(/✅\s*Highlights?:?\s*([\s\S]*?)(?=\n\n|$)/i);
    if (highlightMatch) {
      const highlightLines = highlightMatch[1].split('\n').filter(l => l.trim().startsWith('•') || l.trim().startsWith('-'));
      activity.highlights = highlightLines.map(l => l.replace(/^[•\-]\s*/, '').trim());
      activity.description = activity.description.replace(highlightMatch[0], '').trim();
    }
  });

  return {
    intro: parsed.intro,
    activities,
    tips: parsed.tips,
    rawResponse: response,
  };
}

/**
 * Parse trip ideas response into structured format
 */
export function parseTripIdeas(response: string): ParsedTripIdeasResponse {
  const result: ParsedTripIdeasResponse = {
    intro: '',
    ideas: [],
    tips: [],
    rawResponse: response,
  };

  if (!response) return result;

  const lines = response.split('\n');
  let currentIdea: ParsedTripIdea | null = null;
  let introLines: string[] = [];
  let foundFirstIdea = false;
  let ideaCounter = 0;
  let inWhyPerfect = false;
  let inHighlights = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detect idea header: ### 🎰 Las Vegas Weekend or similar
    const ideaMatch = trimmed.match(/^###?\s*([\p{Emoji}\u{1F300}-\u{1F9FF}])\s*(.+)/u);
    if (ideaMatch) {
      if (currentIdea) result.ideas.push(currentIdea);
      ideaCounter++;
      currentIdea = {
        number: ideaCounter,
        emoji: ideaMatch[1],
        title: ideaMatch[2].trim(),
        destination: '',
        cost: '',
        travelTime: '',
        whyPerfect: [],
        description: '',
        highlights: [],
      };
      foundFirstIdea = true;
      inWhyPerfect = false;
      inHighlights = false;
      continue;
    }

    if (currentIdea) {
      // Parse destination
      if (/^📍|^Destination:|^Ziel:|^Destino:/i.test(trimmed)) {
        currentIdea.destination = trimmed.replace(/^📍?\s*(?:Destination|Ziel|Destino)[:\s]*/i, '').trim();
        continue;
      }
      // Parse cost
      if (/^💰|^Budget:|^Cost:|^Kosten:/i.test(trimmed)) {
        currentIdea.cost = trimmed.replace(/^💰?\s*(?:Budget|Cost|Kosten)[:\s]*/i, '').trim();
        continue;
      }
      // Parse travel time
      if (/^✈️|^🗓️|^Reisezeit:|^Travel/i.test(trimmed)) {
        currentIdea.travelTime = trimmed.replace(/^[✈️🗓️]?\s*(?:Reisezeit|Travel\s*(?:Time)?)[:\s]*/i, '').trim();
        continue;
      }
      // Why perfect section
      if (/Warum perfekt|Why perfect|✅/i.test(trimmed)) {
        inWhyPerfect = true;
        inHighlights = false;
        continue;
      }
      // Highlights section
      if (/Highlights|🎯/i.test(trimmed)) {
        inHighlights = true;
        inWhyPerfect = false;
        continue;
      }
      // List items
      if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
        const item = trimmed.replace(/^[•\-*]\s*/, '').trim();
        if (inWhyPerfect) currentIdea.whyPerfect.push(item);
        else if (inHighlights) currentIdea.highlights.push(item);
        continue;
      }
      // Description
      if (!inWhyPerfect && !inHighlights && trimmed.length > 10) {
        currentIdea.description += (currentIdea.description ? ' ' : '') + trimmed;
      }
    } else if (!foundFirstIdea) {
      introLines.push(trimmed);
    }
  }

  if (currentIdea) result.ideas.push(currentIdea);
  result.intro = introLines.join(' ').replace(/^#+\s*/, '').trim();

  // Extract tips
  const tipMatches = response.match(/💡[^\n]+|Tipp?:?[^\n]+/gi);
  if (tipMatches) result.tips = tipMatches.slice(0, 5).map(t => t.trim());

  return result;
}
