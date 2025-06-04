// pages/api/auth/test.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const supabase = createPagesServerClient({ req, res });
    
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return res.status(401).json({
        authenticated: false,
        message: 'No valid session found'
      });
    }

    return res.status(200).json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email
      }
    });
  } catch (error) {
    console.error('Authentication test error:', error);
    return res.status(500).json({ error: 'Failed to test authentication' });
  }
}