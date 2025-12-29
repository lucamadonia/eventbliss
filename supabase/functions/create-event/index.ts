import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateAccessCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const random = Math.random().toString(36).substring(2, 6);
  return `${base}-${random}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract user from Authorization header
    let userId: string | null = null;
    let userEmail: string | null = null;
    const authHeader = req.headers.get("Authorization");
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (!userError && user) {
        userId = user.id;
        userEmail = user.email || null;
        console.log("Authenticated user:", userId);
      }
    }

    const body = await req.json();
    const {
      name,
      honoree_name,
      event_type = "bachelor",
      event_date,
      description,
      date_blocks,
      no_gos,
      focus_points,
      organizer_name,
      organizer_email,
      participants = [],
      locale = "de",
      currency = "EUR",
      timezone = "Europe/Berlin",
    } = body;

    console.log("Creating event:", { name, honoree_name, event_type });

    // Generate unique slug and access code
    const slug = generateSlug(name);
    const access_code = generateAccessCode();

    // Default survey configuration
    const defaultSettings = {
      form_locked: false,
      date_blocks: date_blocks || {},
      date_warnings: {},
      no_gos: no_gos || [],
      focus_points: focus_points || [],
      
      // Default options for survey
      budget_options: [
        { value: "80-150", label: "80–150 €" },
        { value: "150-250", label: "150–250 €" },
        { value: "250-400", label: "250–400 €" },
        { value: "400+", label: "400 €+" },
      ],
      
      destination_options: [
        { value: "de_city", label: "Großstadt in Deutschland" },
        { value: "barcelona", label: "Barcelona", emoji: "🇪🇸" },
        { value: "lisbon", label: "Lissabon", emoji: "🇵🇹" },
        { value: "prague", label: "Prag", emoji: "🇨🇿" },
        { value: "budapest", label: "Budapest", emoji: "🇭🇺" },
        { value: "either", label: "Egal – Hauptsache cool" },
      ],
      
      activity_options: [
        { value: "karting", label: "Karting", emoji: "🏎️", category: "action" },
        { value: "escape_room", label: "Escape Room", emoji: "🔐", category: "action" },
        { value: "lasertag", label: "Lasertag", emoji: "🔫", category: "action" },
        { value: "axe_throwing", label: "Axtwerfen", emoji: "🪓", category: "action" },
        { value: "vr_simracing", label: "VR Arena / Sim-Racing", emoji: "🎮", category: "action" },
        { value: "climbing", label: "Kletterhalle / Bouldern", emoji: "🧗", category: "outdoor" },
        { value: "bubble_soccer", label: "Bubble Soccer", emoji: "⚽", category: "action" },
        { value: "outdoor", label: "Outdoor Challenge", emoji: "🏕️", category: "outdoor" },
        { value: "wellness", label: "Wellness / Sauna", emoji: "🧖", category: "chill" },
        { value: "food", label: "Food / Dinner Experience", emoji: "🍽️", category: "food" },
        { value: "mixed", label: "Gemischt – alles ein bisschen", emoji: "🎯", category: "other" },
      ],
      
      duration_options: [
        { value: "day", label: "Tages-JGA (nur Samstag)" },
        { value: "weekend", label: "Wochenende (2–3 Tage)" },
        { value: "either", label: "Egal – beides ok" },
      ],
      
      travel_options: [
        { value: "daytrip", label: "Tagestrip ohne Übernachtung" },
        { value: "one_night", label: "1 Nacht ist ok" },
        { value: "two_nights", label: "2 Nächte sind ok" },
        { value: "either", label: "Egal – flexibel" },
      ],
      
      fitness_options: [
        { value: "chill", label: "Entspannt", emoji: "🛋️" },
        { value: "normal", label: "Normal", emoji: "🚶" },
        { value: "sporty", label: "Sportlich", emoji: "💪" },
      ],
      
      alcohol_options: [
        { value: "yes", label: "Mit Alkohol ok", emoji: "🍻" },
        { value: "no", label: "Lieber alkoholfrei" },
        { value: "either", label: "Egal" },
      ],
      
      attendance_options: [
        { value: "yes", label: "Ja, bin dabei!", emoji: "🎉" },
        { value: "maybe", label: "Vielleicht / unter Vorbehalt" },
        { value: "no", label: "Leider nein", emoji: "😔" },
      ],
      
      branding: {
        primary_color: "#8B5CF6",
        accent_color: "#06B6D4",
        background_style: "gradient",
      },
    };

    // Create event with created_by set to authenticated user
    const { data: event, error: eventError } = await supabase
      .from("events")
      .insert({
        name,
        honoree_name,
        event_type,
        event_date,
        description,
        slug,
        access_code,
        locale,
        currency,
        timezone,
        status: "planning",
        settings: defaultSettings,
        created_by: userId,
        theme: {
          primary_color: "#8B5CF6",
          accent_color: "#06B6D4",
        },
      })
      .select()
      .single();

    if (eventError) {
      console.error("Error creating event:", eventError);
      throw new Error(`Failed to create event: ${eventError.message}`);
    }

    console.log("Event created:", event.id);

    // Add organizer as first participant with user_id
    if (organizer_name) {
      const { error: organizerError } = await supabase
        .from("participants")
        .insert({
          event_id: event.id,
          name: organizer_name,
          email: organizer_email || userEmail,
          role: "organizer",
          status: "confirmed",
          user_id: userId,
          can_access_dashboard: true,
          dashboard_permissions: {
            can_view_responses: true,
            can_add_expenses: true,
            can_view_all_expenses: true,
            can_edit_settings: true,
          },
        });

      if (organizerError) {
        console.error("Error adding organizer:", organizerError);
      }
    }

    // Add other participants
    if (participants.length > 0) {
      const participantRecords = participants.map((p: { name: string; email?: string }) => ({
        event_id: event.id,
        name: p.name,
        email: p.email,
        role: "guest",
        status: "invited",
      }));

      const { error: participantsError } = await supabase
        .from("participants")
        .insert(participantRecords);

      if (participantsError) {
        console.error("Error adding participants:", participantsError);
      }
    }

    // Create default message templates
    const defaultTemplates = [
      {
        event_id: event.id,
        template_key: "kickoff",
        title: "Kickoff Message",
        emoji_prefix: "🎉",
        content_template: `Hey Männer!\nEiner aus unserer Runde sagt bald offiziell „Ja" – höchste Zeit, gemeinsam einen richtig guten JGA auf die Beine zu stellen.\n\n👉 Bitte füllt die Umfrage aus: {{link}}\nCode: {{code}}\n\nZiel: Ein entspannter, gut geplanter Abend mit allem, was dazugehört.`,
        sort_order: 1,
        locale,
      },
      {
        event_id: event.id,
        template_key: "budget_poll",
        title: "Budget Poll",
        emoji_prefix: "💸",
        content_template: `Männer, damit keiner am Ende pleite ist – was darf der Spaß kosten (pro Person)?\n\n🔘 bis 100 € – Team Sparfuchs\n🔘 150–200 € – Team realistisch\n🔘 250 €+ – Team Eskalation\n\nBitte ehrlich stimmen!`,
        sort_order: 2,
        locale,
      },
      {
        event_id: event.id,
        template_key: "accommodation",
        title: "Accommodation Poll",
        emoji_prefix: "🏨",
        content_template: `Wir brauchen ein Bett – oder wenigstens einen Boden.\n\nLieber:\n🔘 Hotel (bequem, aber teurer)\n🔘 Airbnb (mehr Platz & Chaos)\n🔘 Hostel (weniger Komfort, mehr Abenteuer)\n\nWer mit einer Luftmatratze glücklich wird – einfach „Ich bin flexibel" schreiben.`,
        sort_order: 3,
        locale,
      },
      {
        event_id: event.id,
        template_key: "packing_list",
        title: "Packing List",
        emoji_prefix: "🧳",
        content_template: `Jungs, bitte einpacken:\n✅ Ausweis\n✅ Bargeld\n✅ Handy & Ladegerät\n✅ Kopfschmerztabletten (ihr wisst wieso)\n✅ Wechselshirt (für alle Fälle)\n✅ gute Laune`,
        sort_order: 4,
        locale,
      },
      {
        event_id: event.id,
        template_key: "travel_info",
        title: "Travel Info",
        emoji_prefix: "🗺️",
        content_template: `Anreiseplan:\nTreffpunkt: {{meeting_point}}\nUhrzeit: {{meeting_time}}\n\nWer fährt mit wem? Bitte in die Gruppe schreiben:\n„Fahre selbst + Platz für X Leute"\noder\n„Suche Mitfahrgelegenheit aus [Ort]"`,
        sort_order: 5,
        locale,
      },
      {
        event_id: event.id,
        template_key: "countdown",
        title: "Countdown Reminder",
        emoji_prefix: "📢",
        content_template: `Männer!\nNoch 3 Tage bis zum JGA. Jetzt nochmal kurz checken:\n✅ Geld überwiesen\n✅ Outfit klar\n✅ Zimmerverteilung verstanden\n✅ Gruppe gemutet – sonst wird der Chat wild\n\nDer Countdown läuft… und keiner kommt raus!`,
        sort_order: 6,
        locale,
      },
      {
        event_id: event.id,
        template_key: "gifts",
        title: "Gift Coordination",
        emoji_prefix: "🎁",
        content_template: `Wer bringt was für {{honoree_name}}?\n🔹 Eine peinliche Aufgabe\n🔹 Ein Geschenk mit Erinnerungswert\n🔹 Ein Shot aus seiner Vergangenheit\n\nBitte kurz in die Gruppe schreiben – damit es nicht 5 Flachmänner und kein Plan gibt 😅`,
        sort_order: 7,
        locale,
      },
      {
        event_id: event.id,
        template_key: "motivation",
        title: "Motivation",
        emoji_prefix: "🎤",
        content_template: `Jungs, ab jetzt wird nicht mehr diskutiert – sondern eskaliert.\nJeder hat heute eine Aufgabe:\n🔸 Spaß haben\n🔸 Bräutigam feiern\n🔸 Nicht verloren gehen\n🔸 Und: Wer meckert, muss 'nen Shot trinken 🍻`,
        sort_order: 8,
        locale,
      },
      {
        event_id: event.id,
        template_key: "payment",
        title: "Payment Request",
        emoji_prefix: "🧾",
        content_template: `Kleines Finanz-Update:\nBitte überweist bis {{deadline}} auf folgendes Konto/Link:\n{{payment_link}}\n\nBetrag: {{amount}}\n\nOhne Moos = kein Los. Wer nicht zahlt, wird mit Karaoke bestraft. 😬`,
        sort_order: 9,
        locale,
      },
      {
        event_id: event.id,
        template_key: "date_locked",
        title: "Date Confirmed",
        emoji_prefix: "✅",
        content_template: `Der Termin steht!\n\n📅 {{locked_date}}\n\nBitte alle vormerken und keine Ausreden mehr! 🎉`,
        sort_order: 10,
        locale,
      },
    ];

    const { error: templatesError } = await supabase
      .from("message_templates")
      .insert(defaultTemplates);

    if (templatesError) {
      console.error("Error creating templates:", templatesError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        event: {
          id: event.id,
          slug: event.slug,
          access_code: event.access_code,
          name: event.name,
          honoree_name: event.honoree_name,
        },
        share_link: `${req.headers.get("origin")}/e/${event.slug}`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in create-event:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
