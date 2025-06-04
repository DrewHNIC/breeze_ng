import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, password, userType } = req.body;

  try {
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    // Add user details to the appropriate table based on user type
    const { data, error } = await supabase
      .from(userType + 's')
      .insert([{ id: authData.user!.id, name, email }]);

    if (error) throw error;

    res.status(200).json({ message: 'User created successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}