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

// Day Plan specific interfaces - Time of day categorization
export type TimeOfDay = 'morning' | 'noon' | 'evening' | 'night';

export interface TimeBlocksByPeriod {
  morning: ParsedTimeBlock[];
  noon: ParsedTimeBlock[];
  evening: ParsedTimeBlock[];
  night: ParsedTimeBlock[];
}

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
  timeOfDay?: TimeOfDay;
}

export interface ParsedDay {
  dayName: string;
  title: string;
  emoji: string;
  timeBlocks: ParsedTimeBlock[];
  blocksByPeriod?: TimeBlocksByPeriod;
}

export interface ParsedDayPlan {
  intro: string;
  days: ParsedDay[];
  generalTips: string[];
  rawResponse: string;
}

/**
 * Determine time of day from time string
 */
export function getTimeOfDay(timeString: string): TimeOfDay {
  const match = timeString.match(/(\d{1,2}):(\d{2})/);
  if (!match) return 'morning';
  
  const hour = parseInt(match[1], 10);
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'noon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

/**
 * Group time blocks by period of day
 */
export function groupTimeBlocksByPeriod(timeBlocks: ParsedTimeBlock[]): TimeBlocksByPeriod {
  return {
    morning: timeBlocks.filter(b => getTimeOfDay(b.time) === 'morning'),
    noon: timeBlocks.filter(b => getTimeOfDay(b.time) === 'noon'),
    evening: timeBlocks.filter(b => getTimeOfDay(b.time) === 'evening'),
    night: timeBlocks.filter(b => getTimeOfDay(b.time) === 'night'),
  };
}

/**
 * Clean all markdown and format fields in a time block
 */
function cleanTimeBlockFields(block: ParsedTimeBlock): ParsedTimeBlock {
  return {
    ...block,
    title: cleanMarkdown(block.title),
    description: cleanMarkdown(block.description),
    location: cleanMarkdown(block.location),
    transport: cleanMarkdown(block.transport),
    cost: cleanMarkdown(block.cost),
    duration: cleanMarkdown(block.duration),
    tips: block.tips.map(cleanMarkdown),
    warnings: block.warnings.map(cleanMarkdown),
    timeOfDay: getTimeOfDay(block.time),
  };
}

/**
 * Clean markdown formatting from text
 * Removes **, *, __, _ and cleans up whitespace
 * Exported for use in components that need to clean AI output
 */
export function cleanMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*/g, '')      // Bold **text**
    .replace(/\*([^*]+)\*/g, '$1') // Italic *text*
    .replace(/__/g, '')        // Bold __text__
    .replace(/_([^_]+)_/g, '$1')   // Italic _text_
    .replace(/^\*\s+/gm, '')   // Bullet point at line start
    .replace(/^-\s+/gm, '')    // Dash bullet at line start
    .replace(/\s+/g, ' ')      // Multiple spaces to single
    .trim();
}

/**
 * Clean time string - remove spaces in numbers like "1 5:00" → "15:00"
 */
function cleanTimeString(time: string): string {
  // Remove spaces between digits: "1 5:00" → "15:00", "2 2:00" → "22:00"
  return time.replace(/(\d)\s+(\d)/g, '$1$2').trim();
}

/**
 * Detect if response is a day plan or activities list
 */
export function detectResponseType(response: string): 'day_plan' | 'activities' | 'general' {
  if (!response) return 'general';
  
  // Comprehensive day name list for all 10 languages
  const dayNamesPattern = [
    // German
    'Freitag|Samstag|Sonntag|Montag|Dienstag|Mittwoch|Donnerstag',
    // English
    'Friday|Saturday|Sunday|Monday|Tuesday|Wednesday|Thursday',
    // French
    'Vendredi|Samedi|Dimanche|Lundi|Mardi|Mercredi|Jeudi',
    // Spanish
    'Viernes|Sábado|Domingo|Lunes|Martes|Miércoles|Jueves',
    // Italian
    'Venerdì|Sabato|Domenica|Lunedì|Martedì|Mercoledì|Giovedì',
    // Dutch
    'Vrijdag|Zaterdag|Zondag|Maandag|Dinsdag|Woensdag|Donderdag',
    // Polish
    'Piątek|Sobota|Niedziela|Poniedziałek|Wtorek|Środa|Czwartek',
    // Portuguese
    'Sexta|Sábado|Domingo|Segunda|Terça|Quarta|Quinta',
    // Turkish
    'Cuma|Cumartesi|Pazar|Pazartesi|Salı|Çarşamba|Perşembe',
    // Generic patterns
    'Tag\\s*\\d|Day\\s*\\d|Jour\\s*\\d|Día\\s*\\d|Giorno\\s*\\d|Dag\\s*\\d|Dzień\\s*\\d|Gün\\s*\\d',
  ].join('|');
  
  // Day plan patterns - support multiple formats
  // Pattern 1: ## Day: Title (structured format)
  const hasStructuredDayHeaders = new RegExp(`##\\s*(${dayNamesPattern})`, 'i').test(response);
  
  // Pattern 2: **Day:** Title (bold format the AI sometimes uses)
  const hasBoldDayHeaders = new RegExp(`\\*\\*\\s*(${dayNamesPattern})[:\\s]`, 'i').test(response);
  
  // Count time patterns (also handle malformed times like "1 5:00")
  const timeBlockCount = (response.match(/\d\s*\d?:\d{2}\s*(Uhr|AM|PM|h)?/g) || []).length;
  
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
  result.intro = cleanMarkdown(introLines.join('\n').replace(/^#+\s*/, '').trim());

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
    result.generalTips = tipMatches.slice(0, 5).map(t => cleanMarkdown(t.trim()));
  }

  // Clean all time blocks and group by period
  result.days = result.days.map(day => {
    const cleanedBlocks = day.timeBlocks.map(cleanTimeBlockFields);
    return {
      ...day,
      dayName: cleanMarkdown(day.dayName),
      title: cleanMarkdown(day.title),
      timeBlocks: cleanedBlocks,
      blocksByPeriod: groupTimeBlocksByPeriod(cleanedBlocks),
    };
  });

  console.log('=== Day Plan Parser (Line-by-Line) ===');
  console.log('Total days found:', result.days.length);
  result.days.forEach((d, i) => console.log(`- TAG ${i + 1}: ${d.dayName} (${d.timeBlocks.length} blocks)`));

  return result;
}

/**
 * Match day header in various formats
 * Supports all 10 languages including Italian day names
 */
function matchDayHeader(line: string): { dayName: string; title: string; emoji: string } | null {
  // All day name patterns - comprehensive list for all 10 supported languages
  const dayNamePattern = '(' + [
    // German
    'Freitag|Samstag|Sonntag|Montag|Dienstag|Mittwoch|Donnerstag',
    // English
    'Friday|Saturday|Sunday|Monday|Tuesday|Wednesday|Thursday',
    // French
    'Vendredi|Samedi|Dimanche|Lundi|Mardi|Mercredi|Jeudi',
    // Spanish
    'Viernes|Sábado|Domingo|Lunes|Martes|Miércoles|Jueves',
    // Italian
    'Venerdì|Sabato|Domenica|Lunedì|Martedì|Mercoledì|Giovedì',
    // Dutch
    'Vrijdag|Zaterdag|Zondag|Maandag|Dinsdag|Woensdag|Donderdag',
    // Polish
    'Piątek|Sobota|Niedziela|Poniedziałek|Wtorek|Środa|Czwartek',
    // Portuguese
    'Sexta|Sábado|Domingo|Segunda|Terça|Quarta|Quinta',
    // Turkish
    'Cuma|Cumartesi|Pazar|Pazartesi|Salı|Çarşamba|Perşembe',
    // Arabic (transliterated)
    'الجمعة|السبت|الأحد|الاثنين|الثلاثاء|الأربعاء|الخميس',
    // Generic day/tag patterns
    'Tag\\s*\\d+|Day\\s*\\d+|Jour\\s*\\d+|Día\\s*\\d+|Giorno\\s*\\d+|Dag\\s*\\d+|Dzień\\s*\\d+|Gün\\s*\\d+',
  ].join('|') + ')';
  
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
      const title = match[2] ? cleanMarkdown(match[2]) : '';
      const emojiMatch = title.match(/([\p{Emoji}\u{1F300}-\u{1F9FF}]+)/gu);
      return {
        dayName: cleanMarkdown(match[1]),
        title: title.replace(/([\p{Emoji}\u{1F300}-\u{1F9FF}]+)/gu, '').trim(),
        emoji: emojiMatch ? emojiMatch.join('') : '📅',
      };
    }
  }

  return null;
}

/**
 * Match time block header in various formats
 * Handles malformed times like "1 5:00" (should be "15:00")
 */
function matchTimeBlockHeader(line: string): { time: string; title: string; emoji: string } | null {
  // First, clean up spaces in time patterns: "1 5:00" → "15:00"
  const cleanedLine = line.replace(/(\d)\s+(\d)/g, '$1$2');
  
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
    // Plain time at line start: 17:00 Activity Title
    /^(\d{1,2}:\d{2})\s*(Uhr|AM|PM|h)?\s+([^\d].+)/u,
  ];

  for (const pattern of patterns) {
    const match = cleanedLine.match(pattern);
    if (match) {
      const time = cleanTimeString(match[1]) + (match[2] ? ` ${match[2]}` : '');
      let title = '';
      let emoji = '📍';

      if (match.length === 5) {
        // Pattern with separate emoji capture
        emoji = match[3] || '📍';
        title = cleanMarkdown(match[4]);
      } else {
        // Pattern with title only
        title = cleanMarkdown(match[3]);
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
 * Handles multiple formats including:
 * - 📍 **Ort:** Value (new structured format)
 * - 📍 Ort: Value (simple format)
 * - **Location:** Value (bold label format)
 */
function parseContentLine(line: string, block: ParsedTimeBlock): void {
  const trimmed = line.trim();
  
  // Skip separators and empty bullet points
  if (trimmed.startsWith('---') || trimmed === '*' || trimmed === '-') return;

  // Helper to extract value after label (handles **Label:** Value and Label: Value)
  const extractValue = (pattern: RegExp): string | null => {
    const match = trimmed.match(pattern);
    if (match) {
      // Remove markdown and clean up
      return cleanMarkdown(match[1] || '');
    }
    return null;
  };

  // Location: 📍 **Ort:** Place OR 📍 Ort: Place OR **Location:** Place
  const locationPatterns = [
    /^📍\s*\*\*(?:Ort|Location|Place|Lieu|Lugar|Luogo|Locatie|Miejsce|Local|Yer|الموقع):\*\*\s*(.+)/i,
    /^📍\s*(?:Ort|Location|Place|Lieu|Lugar|Luogo|Locatie|Miejsce|Local|Yer|الموقع)?[:\s]*(.+)/i,
    /^\*\*(?:Ort|Location|Place|Lieu|Lugar|Luogo|Locatie|Miejsce|Local|Yer|الموقع):\*\*\s*(.+)/i,
    /^(?:Ort|Location|Place|Lieu|Lugar|Luogo|Locatie|Miejsce|Local|Yer):\s*(.+)/i,
  ];
  for (const pattern of locationPatterns) {
    const value = extractValue(pattern);
    if (value && value.length > 2) {
      block.location = value;
      return;
    }
  }

  // Cost: 💰 **Kosten:** ~50€ OR 💰 Kosten: OR **Cost:**
  const costPatterns = [
    /^💰\s*\*\*(?:Kosten|Cost|Costo|Coût|Custo|Maliyet|التكلفة|Koszt):\*\*\s*(.+)/i,
    /^💰\s*(?:Kosten|Cost|Costo|Coût|Custo|Maliyet|التكلفة|Koszt)?[:\s]*(.+)/i,
    /^\*\*(?:Kosten|Cost|Costo|Coût|Custo|Maliyet|التكلفة|Koszt):\*\*\s*(.+)/i,
    /^(?:Kosten|Cost|Costo|Coût|Custo|Maliyet|Koszt):\s*(.+)/i,
  ];
  for (const pattern of costPatterns) {
    const value = extractValue(pattern);
    if (value && value.length > 1) {
      block.cost = value;
      return;
    }
  }

  // Duration: ⏱️ **Dauer:** 2 Stunden
  const durationPatterns = [
    /^⏱️\s*\*\*(?:Dauer|Duration|Durée|Duración|Durata|Duur|Czas|Duração|Süre|المدة):\*\*\s*(.+)/i,
    /^⏱️\s*(?:Dauer|Duration|Durée|Duración|Durata|Duur|Czas|Duração|Süre|المدة)?[:\s]*(.+)/i,
    /^\*\*(?:Dauer|Duration|Durée|Duración|Durata|Duur|Czas|Duração|Süre|المدة):\*\*\s*(.+)/i,
    /^(?:Dauer|Duration|Durée|Duración|Durata|Duur|Czas|Duração|Süre):\s*(.+)/i,
  ];
  for (const pattern of durationPatterns) {
    const value = extractValue(pattern);
    if (value && value.length > 1) {
      block.duration = value;
      return;
    }
  }

  // Description: 📝 **Beschreibung:** Text
  const descPatterns = [
    /^📝\s*\*\*(?:Beschreibung|Description|Descripción|Descrição|Descrizione|Omschrijving|Opis|Açıklama|الوصف):\*\*\s*(.+)/i,
    /^📝\s*(.+)/,
    /^\*\*(?:Beschreibung|Description|Descripción|Descrição|Descrizione|Omschrijving|Opis|Açıklama|الوصف):\*\*\s*(.+)/i,
  ];
  for (const pattern of descPatterns) {
    const value = extractValue(pattern);
    if (value && value.length > 5) {
      block.description = (block.description ? block.description + ' ' : '') + value;
      return;
    }
  }

  // Tips: 💡 **Tipp:** ... OR 💡 Tip:
  const tipPatterns = [
    /^💡\s*\*\*(?:Tipp?|Tip|Conseil|Consejo|Consiglio|Dica|Wskazówka|İpucu|نصيحة):\*\*\s*(.+)/i,
    /^💡\s*(?:Tipp?|Tip|Conseil|Consejo|Consiglio|Dica|Wskazówka|İpucu|نصيحة)?[:\s]*(.+)/i,
    /^\*\*(?:Tipp?|Tip|Conseil|Consejo|Consiglio|Dica|Wskazówka|İpucu|نصيحة):\*\*\s*(.+)/i,
    /^(?:Pro-?Tipp?|Tip|Conseil|Consejo|Consiglio|Dica|Wskazówka|İpucu):\s*(.+)/i,
  ];
  for (const pattern of tipPatterns) {
    const value = extractValue(pattern);
    if (value && value.length > 3) {
      block.tips.push(value);
      return;
    }
  }

  // Transport: 🚗 **Transport:** Details
  if (/^[🚗🚕🚌🚇🚃]|^Transport/i.test(trimmed)) {
    const value = trimmed.replace(/^[🚗🚕🚌🚇🚃\s]*\*?\*?(?:Transport)?\*?\*?[:\s]*/i, '').trim();
    if (value) {
      block.transport = cleanMarkdown(value);
      return;
    }
  }

  // Warnings: ⚠️ **Wichtig:** ... OR ☔ **Alternativ:**
  if (/^[⚠️☔]|^Wichtig:|^Warning:|^Achtung:|^Important:|^Alternativ/i.test(trimmed)) {
    const value = trimmed.replace(/^[\s⚠️☔]*\*?\*?(?:Wichtig|Warning|Achtung|Important|Alternativ|Alternative)?\*?\*?[:\s]*/i, '').trim();
    if (value) {
      block.warnings.push(cleanMarkdown(value));
      return;
    }
  }

  // Restaurant/Food specific
  if (/^🍽️|^Restaurant:|^Food:/i.test(trimmed)) {
    const value = trimmed.replace(/^🍽️?\s*(?:Restaurant|Food)?[:\s]*/i, '').trim();
    if (value) {
      block.location = block.location || cleanMarkdown(value);
      block.category = 'food';
    }
    return;
  }

  // Generic **Label:** Value fallback - catch any remaining structured fields
  const genericLabelMatch = trimmed.match(/^\*?\s*\*\*([^:*]+):\*\*\s*(.+)/);
  if (genericLabelMatch) {
    const label = genericLabelMatch[1].toLowerCase();
    const value = cleanMarkdown(genericLabelMatch[2]);
    
    // Map label to appropriate field based on keywords
    if (/dura|zeit|time|hour|ore|heure|hora|uur|czas|tempo|süre/i.test(label)) {
      block.duration = block.duration || value;
      return;
    } else if (/cost|kost|preis|costo|prix|custo|maliyet|precio|kosten/i.test(label)) {
      block.cost = block.cost || value;
      return;
    } else if (/ort|loc|lieu|lugar|luogo|locatie|miejsce|local|yer|place/i.test(label)) {
      block.location = block.location || value;
      return;
    } else if (/desc|beschr|omschr|opis|açıklama/i.test(label)) {
      block.description = (block.description ? block.description + ' ' : '') + value;
      return;
    } else if (/tip|tipp|conseil|consejo|consiglio|dica|wskazówka|ipucu/i.test(label)) {
      block.tips.push(value);
      return;
    }
    // If unrecognized label, add to description
    block.description = (block.description ? block.description + ' ' : '') + value;
    return;
  }

  // Everything else is description (if not starting with emoji labels we already handled)
  if (trimmed && !trimmed.match(/^[-*]+$/) && !trimmed.match(/^[📍💰⏱️📝💡⚠️☔🚗🚕🚌🚇]/)) {
    block.description += (block.description ? '\n' : '') + cleanMarkdown(trimmed);
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

// Multilingual intro patterns to filter out (not activities)
const INTRO_PATTERNS = [
  /^aktivitäten\s+(für|zum)/i, /^activities\s+for/i, /^activités\s+pour/i,
  /^actividades\s+para/i, /^attività\s+per/i, /^activiteiten\s+voor/i,
  /^aktywności\s+(dla|na)/i, /^atividades\s+para/i, /^aktiviteler/i, /^أنشطة/,
  /^hier\s+sind/i, /^here\s+are/i, /^voici/i, /^ecco/i, /^işte/i, /^إليك/,
  /^top\s*\d+\s*(aktivitäten|activities|activités|actividades|attività)/i,
  /^empfohlene/i, /^recommended/i, /^conseillé/i, /^recomendad/i,
];

function isIntroLine(line: string): boolean {
  const trimmed = line.trim().replace(/^#+\s*/, '').replace(/^\*+\s*/, '');
  return INTRO_PATTERNS.some(p => p.test(trimmed));
}

/**
 * Parse activities response into structured format for premium display
 * Supports multiple formats and extracts structured data
 * FIXED: Now properly filters intro lines and requires numbered activities
 */
export function parseActivitiesExtended(response: string): ParsedActivitiesResponse {
  const result: ParsedActivitiesResponse = {
    intro: '',
    activities: [],
    tips: [],
    rawResponse: response,
  };

  if (!response) return result;

  const lines = response.split('\n');
  let currentActivity: ParsedActivityExtended | null = null;
  let introLines: string[] = [];
  let foundFirstActivity = false;
  let activityCounter = 0;
  let inHighlights = false;
  let descriptionBuffer: string[] = [];

  // Category emoji mapping for fallback
  const CATEGORY_EMOJI_MAP: Record<string, string> = {
    action: '🎯', food: '🍽️', wellness: '💆', party: '🎉',
    sightseeing: '📸', adventure: '🏔️', culture: '🎭', nightlife: '🌃',
    outdoor: '🏞️', sport: '⚽', relaxation: '🧘', other: '✨',
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.match(/^[-=*]{3,}$/)) continue;

    // Check if this is an intro line (should not be parsed as activity)
    if (!foundFirstActivity && isIntroLine(trimmed)) {
      introLines.push(trimmed.replace(/^#+\s*/, '').replace(/^\*+\s*/, ''));
      continue;
    }

    // Detect activity headers - FIXED: Must have a number to be an activity
    // Pattern 1: ### 1. 🎯 Activity Name (numbered with emoji)
    const actMatch1 = trimmed.match(/^###?\s*(\d+)\.\s*([\p{Emoji}\u{1F300}-\u{1F9FF}])\s*(.+)/u);
    // Pattern 2: **1. 🎯 Activity Name** (bold numbered)
    const actMatch2 = trimmed.match(/^\*\*\s*(\d+)\.\s*([\p{Emoji}\u{1F300}-\u{1F9FF}])\s*([^*]+)\*\*/u);
    // Pattern 3: 1. 🎯 Activity Name (plain numbered with emoji)
    const actMatch3 = trimmed.match(/^(\d+)\.\s*([\p{Emoji}\u{1F300}-\u{1F9FF}])\s*(.+)/u);
    // Pattern 4: ### 🎯 1. Activity Name (emoji before number)
    const actMatch4 = trimmed.match(/^###?\s*([\p{Emoji}\u{1F300}-\u{1F9FF}])\s*(\d+)\.\s*(.+)/u);
    // Pattern 5: **Aktivität 1: Name** or numbered label
    const actMatch5 = trimmed.match(/^\*\*\s*(?:Aktivität|Activity|Activité|Actividad|Attività|Activiteit|Aktywność|Atividade|Aktivite|نشاط)?\s*(\d+)[:\.\s]+([^*]+)\*\*/i);

    let actMatch = actMatch1 || actMatch2 || actMatch3 || actMatch4 || actMatch5;

    if (actMatch) {
      // Save previous activity with accumulated description
      if (currentActivity) {
        if (descriptionBuffer.length > 0) {
          currentActivity.description = descriptionBuffer.join(' ').trim();
        }
        result.activities.push(currentActivity);
        descriptionBuffer = [];
      }
      activityCounter++;

      let emoji = '✨';
      let title = '';

      if (actMatch1) {
        emoji = actMatch1[2];
        title = actMatch1[3].replace(/\*\*/g, '').trim();
      } else if (actMatch2) {
        emoji = actMatch2[2];
        title = actMatch2[3].trim();
      } else if (actMatch3) {
        emoji = actMatch3[2];
        title = actMatch3[3].replace(/\*\*/g, '').trim();
      } else if (actMatch4) {
        emoji = actMatch4[1];
        title = actMatch4[3].replace(/\*\*/g, '').trim();
      } else if (actMatch5) {
        title = actMatch5[2].trim();
        const emojiInTitle = title.match(/([\p{Emoji}\u{1F300}-\u{1F9FF}])/u);
        if (emojiInTitle) {
          emoji = emojiInTitle[1];
          title = title.replace(emojiInTitle[0], '').trim();
        }
      }

      currentActivity = {
        number: activityCounter,
        emoji,
        title: title.replace(/^\*\*|\*\*$/g, '').trim(),
        category: 'other',
        duration: '',
        cost: '',
        fitness: 'normal',
        description: '',
        rawSection: '',
        location: undefined,
        highlights: [],
      };
      foundFirstActivity = true;
      inHighlights = false;
      continue;
    }

    if (currentActivity) {
      // Parse description - multilingual (📝 Beschreibung: or Description:)
      if (/^📝|^\*?\*?Beschreibung\*?\*?:|^\*?\*?Description\*?\*?:|^\*?\*?Descripción\*?\*?:|^\*?\*?Descrizione\*?\*?:|^\*?\*?Beschrijving\*?\*?:|^\*?\*?Opis\*?\*?:|^\*?\*?Açıklama\*?\*?:|^وصف:/i.test(trimmed)) {
        const desc = cleanMarkdown(trimmed.replace(/^📝?\s*\*?\*?(?:Beschreibung|Description|Descripción|Descrizione|Beschrijving|Opis|Açıklama|وصف)\*?\*?[:\s]*/i, ''));
        if (desc) descriptionBuffer.push(desc);
        continue;
      }
      
      // Parse duration - multilingual
      if (/^⏱️|^\*?\*?Dauer\*?\*?:|^\*?\*?Duration\*?\*?:|^\*?\*?Durée\*?\*?:|^\*?\*?Duración\*?\*?:|^\*?\*?Durata\*?\*?:|^\*?\*?Duur\*?\*?:|^\*?\*?Czas\*?\*?:|^\*?\*?Süre\*?\*?:|^مدة:/i.test(trimmed)) {
        currentActivity.duration = cleanMarkdown(trimmed.replace(/^⏱️?\s*\*?\*?(?:Dauer|Duration|Durée|Duración|Durata|Duur|Czas|Süre|مدة)\*?\*?[:\s]*/i, ''));
        continue;
      }
      
      // Parse cost - multilingual
      if (/^💰|^\*?\*?Kosten\*?\*?:|^\*?\*?Cost\*?\*?:|^\*?\*?Coût\*?\*?:|^\*?\*?Costo\*?\*?:|^\*?\*?Custo\*?\*?:|^\*?\*?Maliyet\*?\*?:|^تكلفة:|^\*?\*?Preis\*?\*?:/i.test(trimmed)) {
        currentActivity.cost = cleanMarkdown(trimmed.replace(/^💰?\s*\*?\*?(?:Kosten|Cost|Coût|Costo|Custo|Maliyet|تكلفة|Preis)\*?\*?[:\s]*/i, ''));
        continue;
      }
      
      // Parse fitness - multilingual
      if (/^💪|^\*?\*?Fitness\*?\*?:|^\*?\*?Anforderung\*?\*?:|^\*?\*?Requirement\*?\*?:|^\*?\*?Niveau\*?\*?:|^\*?\*?Nivel\*?\*?:|^\*?\*?Livello\*?\*?:|^\*?\*?Kondycja\*?\*?:|^\*?\*?Seviye\*?\*?:|^مستوى:/i.test(trimmed)) {
        const fitnessText = cleanMarkdown(trimmed.replace(/^💪?\s*\*?\*?(?:Fitness|Anforderung|Requirement|Niveau|Nivel|Livello|Kondycja|Seviye|مستوى)\*?\*?[:\s]*/i, '')).toLowerCase();
        if (fitnessText.match(/leicht|easy|facile|fácil|gemakkelijk|łatwy|kolay|سهل/i)) {
          currentActivity.fitness = 'easy';
        } else if (fitnessText.match(/anspruch|challeng|difficile|difícil|moeilijk|trudny|zor|صعب/i)) {
          currentActivity.fitness = 'challenging';
        } else {
          currentActivity.fitness = 'normal';
        }
        continue;
      }
      
      // Parse category - multilingual
      if (/^🎯\s*(?:Kategorie|Category)|^Kategorie:|^Category:|^Catégorie:|^Categoría:|^Categoria:|^Categorie:|^Kategoria:|^Kategori:|^فئة:/i.test(trimmed)) {
        const cat = trimmed.replace(/^🎯?\s*(?:Kategorie|Category|Catégorie|Categoría|Categoria|Categorie|Kategoria|Kategori|فئة)[:\s]*/i, '').toLowerCase();
        if (cat.match(/action|aktion|acción|azione|actie|akcja|aksiyon/i)) currentActivity.category = 'action';
        else if (cat.match(/food|essen|comida|cibo|voedsel|jedzenie|yemek|طعام/i)) currentActivity.category = 'food';
        else if (cat.match(/wellness|entspannung|bienestar|benessere|ontspanning|relaks|rahatlama/i)) currentActivity.category = 'wellness';
        else if (cat.match(/party|fiesta|festa|feest|impreza|parti|حفلة/i)) currentActivity.category = 'party';
        else if (cat.match(/sight|besichtigung|turismo|visite|bezienswaardigh|zwiedzanie|gezi|مشاهدة/i)) currentActivity.category = 'sightseeing';
        else if (cat.match(/adventure|abenteuer|aventura|avventura|avontuur|przygoda|macera/i)) currentActivity.category = 'adventure';
        continue;
      }
      
      // Parse location - multilingual
      if (/^📍|^\*?\*?Ort\*?\*?:|^\*?\*?Location\*?\*?:|^\*?\*?Lieu\*?\*?:|^\*?\*?Lugar\*?\*?:|^\*?\*?Luogo\*?\*?:|^\*?\*?Locatie\*?\*?:|^\*?\*?Miejsce\*?\*?:|^\*?\*?Yer\*?\*?:|^موقع:/i.test(trimmed)) {
        currentActivity.location = cleanMarkdown(trimmed.replace(/^📍?\s*\*?\*?(?:Ort|Location|Lieu|Lugar|Luogo|Locatie|Miejsce|Yer|موقع)\*?\*?[:\s]*/i, ''));
        continue;
      }
      
      // Highlights section
      if (/^✅\s*Highlight|^Highlight/i.test(trimmed)) {
        inHighlights = true;
        continue;
      }
      
      // List items
      if (trimmed.match(/^[•\-✓✔*]\s+/)) {
        const item = trimmed.replace(/^[•\-✓✔*]\s*/, '').trim();
        if (inHighlights && item) {
          currentActivity.highlights.push(item);
        }
        continue;
      }
      
      // Description text - improved: capture text that looks like description
      // Skip metadata prefixes and short lines
      if (trimmed.length > 20 && !trimmed.match(/^[\d]+\./) && !trimmed.match(/^[📍💰⏱️💪🎯✅📝]/) && !trimmed.startsWith('**')) {
        const cleanText = cleanMarkdown(trimmed);
        descriptionBuffer.push(cleanText);
      }
    } else if (!foundFirstActivity && !trimmed.match(/^#/)) {
      // Before first activity - collect as intro
      introLines.push(trimmed);
    }
  }

  // Save last activity
  if (currentActivity) {
    if (descriptionBuffer.length > 0) {
      currentActivity.description = descriptionBuffer.join(' ').trim();
    }
    result.activities.push(currentActivity);
  }
  
  result.intro = introLines.join(' ').slice(0, 500).trim();

  // Infer category from emoji if not set
  result.activities.forEach(act => {
    if (act.category === 'other' && act.emoji) {
      const categoryFromEmoji: Record<string, string> = {
        '🎯': 'action', '🏎️': 'action', '🚁': 'action', '🪂': 'adventure',
        '🍽️': 'food', '🍕': 'food', '🍻': 'food', '☕': 'food', '🍷': 'food', '🍔': 'food', '🍹': 'food',
        '💆': 'wellness', '🧘': 'wellness', '🏊': 'wellness', '♨️': 'wellness',
        '🎉': 'party', '💃': 'party', '🪩': 'party', '🍺': 'party', '🎤': 'party',
        '🏛️': 'sightseeing', '📸': 'sightseeing', '🗺️': 'sightseeing',
        '🏔️': 'adventure', '🏞️': 'adventure', '🌊': 'adventure', '🏜️': 'adventure', '🚴': 'adventure',
        '🎭': 'culture', '🎨': 'culture',
        '🎱': 'activity', '🔫': 'action',
      };
      if (categoryFromEmoji[act.emoji]) {
        act.category = categoryFromEmoji[act.emoji];
      }
    }
  });

  // Extract tips - multilingual
  const tipMatches = response.match(/💡[^\n]+|Budget-?[Tt]ipp?:?[^\n]+/gi);
  if (tipMatches) result.tips = tipMatches.slice(0, 5).map(t => t.trim());

  console.log('=== Activities Parser ===');
  console.log('Activities found:', result.activities.length);
  result.activities.forEach((a, i) => console.log(`- ACT ${i + 1}: ${a.emoji} ${a.title} [${a.category}] desc:${a.description.slice(0,50)}...`));

  return result;
}

/**
 * Parse trip ideas response into structured format
 * Supports multiple formats:
 * - ### [Emoji] Title
 * - **Trip-Idee 1: Title** 🎉
 * - 1. 🎯 Title
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
  let inDescription = false;

  // Multilingual patterns for section headers
  const WHY_PERFECT_PATTERNS = [
    /warum\s*(?:es\s*)?perfekt/i, /why\s*(?:it'?s?\s*)?perfect/i,
    /pourquoi\s*(?:c'est\s*)?parfait/i, /por\s*qu[ée]\s*(?:es\s*)?perfect[oa]?/i,
    /perch[eé]\s*(?:[èe]\s*)?perfett[oa]?/i, /waarom\s*perfect/i,
    /dlaczego\s*ideal/i, /neden\s*mükemmel/i, /لماذا\s*مثالي/i,
    /✅\s*(?:warum|why|pourquoi|por\s*qu|perch|waarom|dlaczego|neden)/i,
  ];
  
  const HIGHLIGHTS_PATTERNS = [
    /^🎯\s*highlight/i, /^highlight/i, /^puntos?\s*(?:destacados?|fuertes?)/i,
    /^points?\s*forts?/i, /^punti\s*salienti/i, /^hoogtepunten/i,
    /^najważniejsze/i, /^öne\s*çıkanlar/i, /^أبرز/i,
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip separator lines
    if (trimmed.match(/^[-=*]{3,}$/)) continue;

    // Detect idea headers - multiple patterns
    // Pattern 1: ### 🎰 Title
    const ideaMatch1 = trimmed.match(/^###?\s*([\p{Emoji}\u{1F300}-\u{1F9FF}])\s*(.+)/u);
    // Pattern 2: **Trip-Idee 1: Title** or **Idea 1: Title**
    const ideaMatch2 = trimmed.match(/^\*\*\s*(?:Trip-?Idee|Idea|Idée|Viaje|Viaggio|Reis|Wycieczka|Viagem|Gezi|فكرة)?\s*(\d+)[:\s]+([^*]+)\*\*/i);
    // Pattern 3: 1. 🎯 Title or **1. 🎯 Title**
    const ideaMatch3 = trimmed.match(/^\*?\*?\s*\d+\.?\s*([\p{Emoji}\u{1F300}-\u{1F9FF}])\s*(?:Name\/Titel|Name|Title|Titre|Nombre|Nome|Naam|Nazwa|İsim|اسم)?[:\s]*([^*]+)\*?\*?/iu);
    // Pattern 4: Plain numbered: 1. Title (fallback)
    const ideaMatch4 = trimmed.match(/^\*?\*?\s*(\d+)\.?\s+(.{10,})/);
    
    const ideaMatch = ideaMatch1 || ideaMatch2 || ideaMatch3;
    
    if (ideaMatch) {
      if (currentIdea) result.ideas.push(currentIdea);
      ideaCounter++;
      
      let emoji = '✨';
      let title = '';
      
      if (ideaMatch1) {
        emoji = ideaMatch1[1];
        title = ideaMatch1[2].replace(/\*\*/g, '').trim();
      } else if (ideaMatch2) {
        title = ideaMatch2[2].trim();
        const emojiInTitle = title.match(/([\p{Emoji}\u{1F300}-\u{1F9FF}])/u);
        if (emojiInTitle) {
          emoji = emojiInTitle[1];
          title = title.replace(emojiInTitle[0], '').trim();
        }
      } else if (ideaMatch3) {
        emoji = ideaMatch3[1];
        title = ideaMatch3[2].replace(/\*\*/g, '').trim();
      }
      
      // Clean title from markdown
      title = title.replace(/^\*\*|\*\*$/g, '').trim();

      currentIdea = {
        number: ideaCounter,
        emoji,
        title,
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
      inDescription = false;
      continue;
    }

    // Check for numbered fallback that might be a new idea (e.g., "2. 📍 Destination")
    if (ideaMatch4 && !currentIdea && parseInt(ideaMatch4[1]) === 1) {
      // This is likely an intro line that looks like a numbered list
    }

    if (currentIdea) {
      // Parse destination - multilingual
      if (/^📍|^2\.\s*📍|^Destination:|^Ziel:|^Destino:|^Destinazione:|^Bestemming:|^Destynacja:|^Destinasyon:|^وجهة:/i.test(trimmed)) {
        currentIdea.destination = trimmed.replace(/^[\d.]*\s*📍?\s*(?:Destination|Ziel|Destino|Destinazione|Bestemming|Destynacja|Destinasyon|وجهة)[:\s]*/i, '').trim();
        inWhyPerfect = false;
        inHighlights = false;
        inDescription = false;
        continue;
      }
      
      // Parse cost - multilingual
      if (/^💰|^4\.\s*💰|^Budget:|^Cost:|^Kosten:|^Costo:|^Coût:|^Custo:|^Maliyet:|^ميزانية:|^(?:Geschätzte\s*)?Kosten|^Estimated\s*cost/i.test(trimmed)) {
        currentIdea.cost = trimmed.replace(/^[\d.]*\s*💰?\s*(?:Geschätzte\s*)?(?:Budget|Cost|Kosten|Costo|Coût|Custo|Maliyet|ميزانية|Estimated\s*cost)[:\s]*/i, '').trim();
        inWhyPerfect = false;
        inHighlights = false;
        inDescription = false;
        continue;
      }
      
      // Parse travel time
      if (/^✈️|^🗓️|^Reisezeit:|^Travel|^Durée|^Duración|^Durata|^Duur|^Czas|^Süre:|^مدة:/i.test(trimmed)) {
        currentIdea.travelTime = trimmed.replace(/^[✈️🗓️]?\s*(?:Reisezeit|Travel\s*(?:Time)?|Durée|Duración|Durata|Duur|Czas|Süre|مدة)[:\s]*/i, '').trim();
        inWhyPerfect = false;
        inHighlights = false;
        inDescription = false;
        continue;
      }
      
      // Why perfect section - check all language patterns
      if (WHY_PERFECT_PATTERNS.some(p => p.test(trimmed))) {
        inWhyPerfect = true;
        inHighlights = false;
        inDescription = false;
        continue;
      }
      
      // Highlights section
      if (HIGHLIGHTS_PATTERNS.some(p => p.test(trimmed))) {
        inHighlights = true;
        inWhyPerfect = false;
        inDescription = false;
        continue;
      }
      
      // Description section - multilingual
      if (/^💡\s*(?:Kurzbeschreibung|Brief\s*description|Description|Descripción|Descrizione|Beschrijving|Opis|Açıklama|وصف)/i.test(trimmed)) {
        inDescription = true;
        inWhyPerfect = false;
        inHighlights = false;
        const desc = trimmed.replace(/^💡\s*(?:Kurzbeschreibung|Brief\s*description|Description|Descripción|Descrizione|Beschrijving|Opis|Açıklama|وصف)[:\s]*/i, '').replace(/^\*\*|\*\*$/g, '').trim();
        if (desc) currentIdea.description = desc;
        continue;
      }
      
      // List items for why perfect or highlights
      if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('✓') || trimmed.startsWith('✔') || trimmed.match(/^\*\s+[^*]/)) {
        const item = trimmed.replace(/^[•\-✓✔*]\s*/, '').replace(/^\*\*|\*\*$/g, '').trim();
        if (inWhyPerfect && item) {
          currentIdea.whyPerfect.push(item);
        } else if (inHighlights && item) {
          currentIdea.highlights.push(item);
        }
        continue;
      }
      
      // General description text (not in special sections, decent length)
      if (!inWhyPerfect && !inHighlights && trimmed.length > 15 && !trimmed.match(/^[\d]+\./)) {
        // Skip lines that are clearly metadata
        if (!trimmed.match(/^[📍💰✈️🗓️💡🎯✅]/)) {
          const cleanText = trimmed.replace(/^\*\*|\*\*$/g, '').trim();
          currentIdea.description += (currentIdea.description ? ' ' : '') + cleanText;
        }
      }
    } else if (!foundFirstIdea) {
      // Intro lines before first idea
      if (!trimmed.match(/^#/)) {
        introLines.push(trimmed);
      }
    }
  }

  if (currentIdea) result.ideas.push(currentIdea);
  result.intro = introLines.join(' ').replace(/^#+\s*/, '').slice(0, 500).trim();

  // Extract tips - multilingual
  const tipMatches = response.match(/💡[^\n]+|(?:Reise|Travel|Budget)?-?[Tt]ipp?s?:?[^\n]+|Conseil:?[^\n]+|Consejo:?[^\n]+/gi);
  if (tipMatches) result.tips = tipMatches.slice(0, 5).map(t => t.trim());

  console.log('=== Trip Ideas Parser ===');
  console.log('Ideas found:', result.ideas.length);
  result.ideas.forEach((idea, i) => console.log(`- IDEA ${i + 1}: ${idea.emoji} ${idea.title} @ ${idea.destination}`));

  return result;
}
