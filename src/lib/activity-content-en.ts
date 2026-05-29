/**
 * English activity content framework for /activities/[slug] pages.
 * Mirrors src/lib/activity-content.ts but in English with stag-do
 * terminology (instead of JGA).
 */

import type { ActivityCategory, ActivityItem } from "./activities-library";
import { JGA_CITIES } from "./jga-cities";

export interface CategoryFrameworkEn {
  hookSentence: string;
  introFor: (a: ActivityItem) => string;
  whenSection: string[];
  whoSection: string[];
  costExplain: string;
  commonMistakes: string[];
  faqs: (a: ActivityItem) => Array<{ q: string; a: string }>;
}

export const CATEGORY_FRAMEWORKS_EN: Record<ActivityCategory, CategoryFrameworkEn> = {
  action: {
    hookSentence: "Action activities are the backbone of classic stag day programmes — adrenaline, competition, guaranteed story material.",
    introFor: (a) =>
      `${a.label} is one of the most-booked action activities for stag dos, hen parties and group trips. The format works through clear competition, instant gratification, and group dynamics — ideal as a Day-2 highlight when the crew is warmed up and wants a peak before the evening.`,
    whenSection: [
      "Day-2 programme — when the group is warm and wants action before the night out",
      "Clean separation from the party programme — action first, bars after",
      "Indoor action beats outdoor in bad weather — book accordingly",
    ],
    whoSection: [
      "Crews of 6+ for solid team dynamics",
      "Grooms with a competitive streak",
      "Works across mixed fitness levels",
    ],
    costExplain:
      "Action activities typically run €30–€90 per person for 1–2 hours of programme. Premium options (drift course, skydiving) push past €150. Booking 4–8 weeks ahead secures peak-season slots.",
    commonMistakes: [
      "Booking too short: 60 minutes often isn't enough — minimum 90 minutes for the full experience.",
      "Right after breakfast — leave processing time after the previous night.",
      "No bad-weather backup for outdoor activities — keep an indoor alternative bookable.",
    ],
    faqs: (a) => [
      {
        q: `What does ${a.label} cost for a stag group?`,
        a: `${a.label} typically runs €30–€90 per person for 60–120 minutes. Group bookings of 8+ usually unlock 10–20% discounts.`,
      },
      {
        q: `What's the ideal group size for ${a.label}?`,
        a: `6–12 people works best. Under 6 the crew dynamic gets weak, over 16 logistics get hard. Larger groups can often split across two slots.`,
      },
      {
        q: `How early should we book ${a.label}?`,
        a: `May–September: 4–8 weeks lead time. Off-season usually 1–2 weeks is enough. Popular slots (Saturday morning) are first to fill.`,
      },
    ],
  },

  outdoor: {
    hookSentence: "Outdoor activities pair nature with group dynamics — from water to mountain, a fixture in stag day programmes.",
    introFor: (a) =>
      `${a.label} is one of the most popular outdoor stag activities and works for crews of any fitness level. Advantage: nature as backdrop for photos, fresh air to recover from the night before, and the option to slot in a picnic or beer stop.`,
    whenSection: [
      "May–September peak season",
      "Sunday morning as hangover therapy",
      "Day highlight for nature-friendly crews",
    ],
    whoSection: [
      "Crews with nature affinity and a camera",
      "Mixed fitness levels (except for hardcore adventure variants)",
      "Grooms aiming to stay fit before the wedding",
    ],
    costExplain:
      "Outdoor activities typically run €30–€80 per person including equipment. Boat charters and premium options €100–€250 per person. Weather is the main risk — cancel-insurance is worth it.",
    commonMistakes: [
      "Forgetting equipment check — weatherproof clothing is often required.",
      "No weather backup planned — most activities don't work in rain.",
      "Underestimating time — outdoor programmes with travel often double in length.",
    ],
    faqs: (a) => [
      {
        q: `Best season for ${a.label}?`,
        a: `May to September for stable weather. In summer book peak slots early; spring/autumn offers more flexibility and lower prices.`,
      },
      {
        q: `Do we need prior experience for ${a.label}?`,
        a: `No — most providers offer 30-minute crash courses for beginners. Premium variants (advanced tours) benefit from basic experience.`,
      },
      {
        q: `What happens in bad weather?`,
        a: `Most operators have cancellation rules or rebooking options. For stags always keep a backup indoor activity — karting, climbing, or escape room.`,
      },
    ],
  },

  chill: {
    hookSentence: "Chill activities are the underrated stag-do class — perfect for Sunday mornings, hangover recovery, or mixed crews.",
    introFor: (a) =>
      `${a.label} works differently from action programmes: no adrenaline, but relaxation with group dynamics. Ideal as Sunday morning programme after a long bar night, or as pre-wedding recovery slot.`,
    whenSection: [
      "Sunday morning as hangover therapy",
      "Pre-wedding programme for recovery",
      "Mixed-generation crews (with in-laws or older relatives)",
    ],
    whoSection: [
      "Crews after a hard night",
      "Mixed groups with varying energy levels",
      "Grooms wanting to recover before the wedding",
    ],
    costExplain:
      "Chill activities typically run €25–€80 per person. Premium wellness packages up to €150. Usually bookable on short notice — no booking-window crunch like action.",
    commonMistakes: [
      "Planning too short — wellness/spa needs 2–3 hours for real effect.",
      "Eating too much beforehand — many chill programmes are calmer post-lunch.",
      "Expectation mismatch — some crews find chill programmes boring; pre-check.",
    ],
    faqs: (a) => [
      {
        q: `Does ${a.label} work after a hard night?`,
        a: `On the contrary — it's often the best time. ${a.label} helps crews process the previous night and re-energise.`,
      },
      {
        q: `Ideal group size?`,
        a: `4–10 people works best. Larger groups are logistically possible but lose intimacy.`,
      },
      {
        q: `Cost per person?`,
        a: `Typically €25–€80 per person for 90–180 minutes. Premium wellness options up to €150.`,
      },
    ],
  },

  food: {
    hookSentence: "Food activities anchor stag dos in eating and drinking — from brewery tours to cooking classes, the best memory material.",
    introFor: (a) =>
      `${a.label} is one of the most underrated stag activities: a shared experience around food or drink that doubles as catering. For crews who want more than activities and bars.`,
    whenSection: [
      "Lunch programme or early evening slot",
      "Replaces catering on long programme days",
      "Sunday brunch alternative",
    ],
    whoSection: [
      "Foodie crews focused on enjoyment",
      "Grooms who love cooking or eating",
      "Mixed crews — food experiences work across age groups",
    ],
    costExplain:
      "Food activities typically run €35–€90 per person. Premium options (multi-course menus, private chef) start at €120. Reserve 3–6 weeks ahead, especially in peak season.",
    commonMistakes: [
      "Not clarifying allergies/preferences ahead — can dampen the mood.",
      "Scheduling too late — hungry crews get impatient.",
      "Forgetting to reserve — top restaurants often have 4–8 week lead times.",
    ],
    faqs: (a) => [
      {
        q: `How long does ${a.label} take?`,
        a: `Typically 2–3 hours including enjoyment time. Cooking classes 3–4 hours; tastings 2 hours.`,
      },
      {
        q: `Can allergies or vegetarian requests be accommodated?`,
        a: `Always flag at booking. Most providers are flexible but 1–2 weeks' notice for special requests is wise.`,
      },
      {
        q: `Cost per person?`,
        a: `Typically €35–€90 per person including food. Premium with upscale menus from €120.`,
      },
    ],
  },

  entertainment: {
    hookSentence: "Entertainment activities are the stag-do jokers — fast to book, always group-friendly, with built-in story value.",
    introFor: (a) =>
      `${a.label} is a classic stag entertainment activity that works without prior experience, with any crew size, and in any mood. Ideal as a filler between main programmes or as an evening opener.`,
    whenSection: [
      "Programme block between activity and dinner",
      "When weather or mood torches the plan — backup Plan B",
      "As spontaneous programme on the day",
    ],
    whoSection: [
      "Any crew configuration",
      "Mixed generations too",
      "Grooms who don't want a sports focus",
    ],
    costExplain:
      "Entertainment activities run €25–€65 per person for 60–120 minutes. Bookable on short notice in most cities.",
    commonMistakes: [
      "Allowing too long — 90 minutes is enough for most entertainment activities.",
      "Underestimating preparation — some activities need crew briefing.",
      "Lone-operator venues — better experience at established locations with group routine.",
    ],
    faqs: (a) => [
      {
        q: `Can we book ${a.label} on short notice?`,
        a: `Usually yes, especially weekdays or off-season. Weekend slots May–September should be secured 2–4 weeks ahead.`,
      },
      {
        q: `Group size for ${a.label}?`,
        a: `Works from 4 people. Sweet spot 8–14 for solid group dynamics. Above 20 logistics get tight.`,
      },
      {
        q: `Cost per person?`,
        a: `Typically €25–€65 per person for 60–120 minutes of programme.`,
      },
    ],
  },

  creative: {
    hookSentence: "Creative activities surprise crews and produce the best photo material — from pottery to painting.",
    introFor: (a) =>
      `${a.label} is the underrated creative stag category: crews build something, learn a new skill, and take home a physical result. That makes ${a.label} the longest-lasting memory source after a stag.`,
    whenSection: [
      "Day-2 as a quieter daytime programme",
      "Brunch slot with mimosas and creative activity",
      "Pre-wedding programme for stress reduction",
    ],
    whoSection: [
      "Crews with foodie or design affinity",
      "Grooms who appreciate craft",
      "Mixed gender / generations",
    ],
    costExplain:
      "Creative activities typically run €40–€80 per person including materials. Premium workshops with pro instruction up to €120. Book 3–5 weeks ahead.",
    commonMistakes: [
      "Pure escalation crews often dislike creative activities.",
      "Underestimating workshop length — usually 2–3 hours, not 1.",
      "Not clarifying take-home rules for materials.",
    ],
    faqs: (a) => [
      {
        q: `Do we need prior knowledge for ${a.label}?`,
        a: `No, providers are set up for beginners. A 15-minute crash course in the first quarter-hour is enough to produce something showable.`,
      },
      {
        q: `How long does ${a.label} usually take?`,
        a: `2–3 hours for a presentable result. With breaks and tasting often 3.5 hours total.`,
      },
      {
        q: `Cost per person?`,
        a: `Typically €40–€80 per person including materials. Pro premium workshops up to €120.`,
      },
    ],
  },

  sport: {
    hookSentence: "Sport activities are stag-do staples for active crews — competition, fitness, team-building in one block.",
    introFor: (a) =>
      `${a.label} gives stags structured competition with clear rules, instant feedback, and photo-worthy moments. Best on Day 2, when the crew is warm and wants to channel energy before the evening.`,
    whenSection: [
      "Day-2 programme for active crews",
      "Morning slot for summer stags",
      "Fitness prep before the wedding",
    ],
    whoSection: [
      "Sporty crews with competitive DNA",
      "Grooms with sports background",
      "Crews wanting to be active in summer",
    ],
    costExplain:
      "Sport activities typically run €25–€75 per person for 90–180 minutes. Equipment usually included.",
    commonMistakes: [
      "Overestimating crew fitness — check beginner options.",
      "Not clarifying equipment ahead — shin guards, shoes etc.",
      "Forgetting non-sporty crew — offer parallel backup programme.",
    ],
    faqs: (a) => [
      {
        q: `Do we need sport experience for ${a.label}?`,
        a: `No, ${a.label} has clear basic rules and beginner instruction. Prior experience is a plus but not required.`,
      },
      {
        q: `Equipment needed?`,
        a: `Usually included in the booking. Sport clothing and sturdy shoes are all you bring.`,
      },
      {
        q: `Cost per person?`,
        a: `Typically €25–€75 per person for 90–180 minutes including equipment.`,
      },
    ],
  },

  nightlife: {
    hookSentence: "Nightlife programmes are the heart of every stag — from curated bar crawls to VIP club entries.",
    introFor: (a) =>
      `${a.label} is one of the central nightlife programmes for stags and hen parties. Picking the right variant (bar crawl, club, karaoke) decides the mood of the night more than any other programme item.`,
    whenSection: [
      "Main night of the stag — usually Saturday",
      "Day-1 arrival night with pre-drinks",
      "Sunday departure night on longer stags",
    ],
    whoSection: [
      "Any crew wanting a classic stag experience",
      "Grooms who appreciate nightlife",
      "Also for mature crews with adjusted tone",
    ],
    costExplain:
      "Nightlife programmes typically run €40–€120 per person for a 4–6 hour evening. Premium options (VIP club, bottle service) from €150 per person.",
    commonMistakes: [
      "Forgetting pre-drinks — saves money and sets the mood.",
      "Ignoring door selection — all-male groups often turned away.",
      "No backup bar if the main venue is full.",
    ],
    faqs: (a) => [
      {
        q: `What time should we start ${a.label}?`,
        a: `DACH: 20:00–22:00 for bars, 23:00–01:00 for clubs. Spain/Italy later (22:00–24:00 for bars, 01:00–03:00 for clubs).`,
      },
      {
        q: `How do we get a male group into top clubs?`,
        a: `Reservations with bottle service bypass door selection. Otherwise: queue with mixed group or split into smaller subgroups.`,
      },
      {
        q: `Cost per person?`,
        a: `Typically €40–€120 per person for 4–6 hours including entries and drinks.`,
      },
    ],
  },

  culture: {
    hookSentence: "Cultural activities add depth to stags — museums, walking tours, historic visits as counterweight to escalation.",
    introFor: (a) =>
      `${a.label} is the cultural programme pillar for stags that want more than escalation. A 90-minute slot is enough to self-justify the weekend culturally — and produces the few photos that can be shown to family.`,
    whenSection: [
      "Daytime programme with cultural ambition",
      "Morning slot before escalation",
      "Sunday morning programme",
    ],
    whoSection: [
      "Crews with cultural ambition",
      "Grooms with history affinity",
      "Mixed-generation groups with relatives",
    ],
    costExplain:
      "Cultural activities typically run €15–€40 per person for 90–180 minutes. Premium themed tours up to €60.",
    commonMistakes: [
      "Too long programmes — 2 hours is enough for most crews.",
      "Not pre-booking tickets — top museums use slot systems.",
      "Not checking crew mood — escalation crews often skip museums.",
    ],
    faqs: (a) => [
      {
        q: `How long should ${a.label} last?`,
        a: `90–120 minutes is the sweet spot. Longer often drags for stag crews.`,
      },
      {
        q: `Should we book tickets in advance?`,
        a: `For popular venues (museums, guided tours) yes — at least 1 week ahead. Spontaneous free-tour-with-guide is usually also an option.`,
      },
      {
        q: `Cost per person?`,
        a: `Typically €15–€40 per person. Premium tours up to €60.`,
      },
    ],
  },

  adventure: {
    hookSentence: "Adventure activities are the XL class — from skydiving to paragliding, once-in-a-lifetime stag stories.",
    introFor: (a) =>
      `${a.label} belongs to the adventure premium class for stags. These activities produce the most intense memories but require courage, budget, and solid planning. Not for every crew — but when it fits, the highlight programme of the trip.`,
    whenSection: [
      "Day-2 as the main programme",
      "May–September for outdoor adventure",
      "Booking 4–8 weeks ahead is mandatory",
    ],
    whoSection: [
      "Risk-tolerant crews with adventure affinity",
      "Grooms who want to skydive once in their lives",
      "Crews with bigger budgets (€100–€250 per activity per person)",
    ],
    costExplain:
      "Adventure activities typically run €100–€250 per person. Premium experiences (skydiving, helicopter tours) from €250. Check operator insurance.",
    commonMistakes: [
      "Not reading the insurance fine print — adventure activities often have special rules.",
      "Underestimating weather dependency — many adventures have ~50% cancellation likelihood.",
      "Not allowing for non-adventure crew — plan a backup for them.",
    ],
    faqs: (a) => [
      {
        q: `Prior experience needed for ${a.label}?`,
        a: `Usually no — tandem variants exist for most adventure activities. Body check and safety briefing are mandatory.`,
      },
      {
        q: `What happens in bad weather?`,
        a: `Adventure activities have weather-specific rules. Clarify cancellation terms before booking. Keep a backup indoor programme bookable.`,
      },
      {
        q: `Cost per person?`,
        a: `Typically €100–€250 per person. Premium experiences above that.`,
      },
    ],
  },
};

export function getCitiesForActivityEn(activitySlug: string) {
  return JGA_CITIES.filter((c) => c.topActivitySlugs.includes(activitySlug)).slice(0, 6);
}
