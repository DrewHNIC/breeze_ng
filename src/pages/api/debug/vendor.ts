// pages/api/debug/vendor.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    // Get the vendor
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', userId)
      .single();

    if (vendorError) {
      return res.status(404).json({ 
        error: 'Vendor not found',
        details: vendorError
      });
    }

    // Get the vendor profile if it exists
    const { data: profileData, error: profileError } = await supabase
      .from('vendor_profiles')
      .select('*')
      .eq('vendor_id', userId)
      .maybeSingle();

    // Get the table structure
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'vendors' });

    return res.status(200).json({
      vendor: vendorData,
      profile: profileData,
      tableInfo: tableInfo,
      errors: {
        profile: profileError ? profileError.message : null,
        table: tableError ? tableError.message : null
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    return res.status(500).json({ error: 'Failed to fetch debug info' });
  }
}