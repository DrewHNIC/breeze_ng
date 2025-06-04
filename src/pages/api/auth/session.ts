// pages/api/auth/session.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create authenticated Supabase client
    const supabase = createPagesServerClient({ req, res });
    
    // Get the session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: session.user.id,
          email: session.user.email,
        },
      },
    });
  } catch (error) {
    console.error('Session error:', error);
    return res.status(500).json({ error: 'Failed to get session' });
  }
}