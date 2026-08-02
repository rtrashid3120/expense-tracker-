import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fmnahchdscuosazwaatx.supabase.co';
const supabaseAnonKey = 'sb_publishable_4baC_Dz1BdTUCnkhy2u_AA_D6REU5Zr';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('Testing signUp...');
  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'test' + Date.now() + '@example.com',
      password: 'password123'
    });
    console.log('SignUp Result:', data, error);
  } catch (err) {
    console.log('SignUp threw:', err);
  }
}

test();
