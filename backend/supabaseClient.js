const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey;

if (!supabaseUrl || !supabaseKey) {
	throw new Error("Missing SUPABASE_URL and Supabase API key in environment");
}

if (!supabaseServiceRoleKey) {
	console.warn("SUPABASE_SERVICE_ROLE_KEY is not set. Backend will use anon key and may hit RLS restrictions.");
}

// Backend should use service role key and enforce auth/authorization in Express.
const supabase = createClient(supabaseUrl, supabaseKey, {
	auth: {
		autoRefreshToken: false,
		persistSession: false,
	},
});

module.exports = supabase;
