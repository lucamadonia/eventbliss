import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if caller has admin role
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .single();

    if (!roles) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, userId, email, password, fullName } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Admin ${caller.email} performing action: ${action} on user: ${userId}`);

    switch (action) {
      case "update": {
        // Update auth user
        const updates: { email?: string; password?: string } = {};
        if (email) updates.email = email;
        if (password) updates.password = password;

        if (Object.keys(updates).length > 0) {
          const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            updates
          );
          if (authUpdateError) throw authUpdateError;
        }

        // Update profile
        if (email || fullName !== undefined) {
          const profileUpdates: { email?: string; full_name?: string } = {};
          if (email) profileUpdates.email = email;
          if (fullName !== undefined) profileUpdates.full_name = fullName;

          const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .update(profileUpdates)
            .eq("id", userId);

          if (profileError) throw profileError;
        }

        return new Response(
          JSON.stringify({ success: true, message: "User updated" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "resetPassword": {
        if (!password) {
          return new Response(JSON.stringify({ error: "Password required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password,
        });

        if (error) throw error;

        // Set must_change_password flag
        await supabaseAdmin
          .from("profiles")
          .update({ must_change_password: true })
          .eq("id", userId);

        return new Response(
          JSON.stringify({ success: true, message: "Password reset" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete": {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, message: "User deleted" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("Error in update-user function:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
