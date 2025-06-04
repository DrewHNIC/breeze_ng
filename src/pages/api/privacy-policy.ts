import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const filePath = path.join(process.cwd(), 'data', 'privacy-policy.html');
      const content = await readFile(filePath, 'utf8');
      res.status(200).json({ content });
    } catch (error) {
      console.error('Error reading privacy policy file:', error);
      res.status(500).json({ error: 'Error loading privacy policy' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}