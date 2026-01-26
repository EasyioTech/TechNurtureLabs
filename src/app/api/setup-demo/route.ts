import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const demoUsers = [
  { email: 'student@demo.com', password: 'student123', role: 'student', full_name: 'Demo Student' },
  { email: 'school@demo.com', password: 'school123', role: 'school_admin', full_name: 'Demo School Admin' },
];

export async function POST() {
  const results = [];

  for (const user of demoUsers) {
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === user.email);

    if (existingUser) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password: user.password, email_confirm: true }
      );

      if (updateError) {
        results.push({ email: user.email, status: 'update error', error: updateError.message });
      } else {
        await supabaseAdmin.from('profiles').upsert({
          id: existingUser.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
        });
        results.push({ email: user.email, status: 'password reset' });
      }
      continue;
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
    });

    if (error) {
      results.push({ email: user.email, status: 'error', error: error.message });
      continue;
    }

    if (data.user) {
      await supabaseAdmin.from('profiles').upsert({
        id: data.user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      });
      results.push({ email: user.email, status: 'created' });
    }
  }

  return NextResponse.json({ results });
}
