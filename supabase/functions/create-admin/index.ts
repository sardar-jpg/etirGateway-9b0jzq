import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Credentials from environment secrets (never hardcode here) ─────────────
const ADMIN_EMAIL          = Deno.env.get('ADMIN_EMAIL') ?? '';
const ADMIN_PASSWORD       = Deno.env.get('ADMIN_PASSWORD') ?? '';
const TEST_CLIENT_EMAIL    = 'testclient@etir.com';
const TEST_CLIENT_PASSWORD = Deno.env.get('TEST_CLIENT_PASSWORD') ?? '';

// ── Helpers ────────────────────────────────────────────────────────────────

async function ensureTestClient(adminClient: ReturnType<typeof createClient>): Promise<void> {
  try {
    const { data: { users } } = await adminClient.auth.admin.listUsers();
    let testUser = users?.find((u: any) => u.email === TEST_CLIENT_EMAIL);

    if (!testUser) {
      const { data, error } = await adminClient.auth.admin.createUser({
        email: TEST_CLIENT_EMAIL,
        password: TEST_CLIENT_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: 'Test Client' },
      });
      if (error) { console.log('Test client create error:', error.message); return; }
      testUser = data.user;
    } else {
      await adminClient.auth.admin.updateUserById(testUser.id, { password: TEST_CLIENT_PASSWORD });
    }

    if (!testUser?.id) return;

    const { data: linkedClient } = await adminClient
      .from('clients')
      .select('id')
      .eq('customer_user_id', testUser.id)
      .maybeSingle();

    if (!linkedClient) {
      const { data: emailClient } = await adminClient
        .from('clients')
        .select('id')
        .eq('email', TEST_CLIENT_EMAIL)
        .maybeSingle();

      if (emailClient) {
        await adminClient.from('clients').update({ customer_user_id: testUser.id }).eq('id', emailClient.id);
      } else {
        const { error: insertErr } = await adminClient.from('clients').insert({
          name: 'Test Client',
          company: 'Demo Company',
          email: TEST_CLIENT_EMAIL,
          phone: '+964 770 000 0001',
          country: 'Iraq',
          city: 'Baghdad',
          notes: 'Auto-created test account for customer portal demo.',
          customer_user_id: testUser.id,
        });
        if (insertErr) console.log('Test client record error:', insertErr.message);
      }
    }
  } catch (e) {
    console.log('ensureTestClient error:', String(e));
  }
}

// ── Main handler ───────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const anonKey     = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      return new Response(
        JSON.stringify({ error: 'ADMIN_EMAIL or ADMIN_PASSWORD secret is not configured.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Step 1: Check if admin user profile already exists
    const { data: existingUsers } = await adminClient
      .from('user_profiles')
      .select('id, email')
      .eq('email', ADMIN_EMAIL)
      .limit(1);

    if (existingUsers && existingUsers.length > 0) {
      // Confirm email and reset password to current secret value
      await adminClient.rpc('confirm_admin_email', { admin_email: ADMIN_EMAIL });

      const { data: { users: allUsers } } = await adminClient.auth.admin.listUsers();
      const adminUser = allUsers?.find((u: any) => u.email === ADMIN_EMAIL);
      if (adminUser) {
        await adminClient.auth.admin.updateUserById(adminUser.id, { password: ADMIN_PASSWORD });
      }

      await ensureTestClient(adminClient);

      return new Response(
        JSON.stringify({ success: true, status: 'already_exists', passwordReset: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Step 2: Sign up using anon client
    const anonClient = createClient(supabaseUrl, anonKey);
    const { data: signUpData, error: signUpError } = await anonClient.auth.signUp({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      options: { data: { full_name: 'MARAS Admin' } },
    });

    if (signUpError) {
      if (signUpError.message.toLowerCase().includes('already')) {
        await adminClient.rpc('confirm_admin_email', { admin_email: ADMIN_EMAIL });
        return new Response(
          JSON.stringify({ success: true, status: 'confirmed_existing' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      return new Response(
        JSON.stringify({ error: signUpError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const userId = signUpData.user?.id;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Signup returned no user ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Step 3: Confirm email via SQL function
    const { error: confirmError } = await adminClient.rpc('confirm_admin_email', { admin_email: ADMIN_EMAIL });

    // Step 4: Create test customer account
    await ensureTestClient(adminClient);

    return new Response(
      JSON.stringify({ success: true, status: 'created', userId, emailConfirmed: !confirmError }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
