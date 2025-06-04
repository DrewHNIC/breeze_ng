
  import type { NextApiRequest, NextApiResponse } from 'next';

// This is a mock database. In a real application, you would fetch this data from your actual database.
const teamMembers = [
    {
        name: 'Achir Andrew Luper',
        position: 'Founder & CEO',
        image: '/team-achir.jpg',
      },
      {
        name: 'Fonsi',
        position: 'Chief Operations Officer',
        image: '/team-fonsi.jpg',
      },
      {
        name: 'Abu Sean',
        position: 'Chief Technology Officer',
        image: '/team-yazan.jpg',
      },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.status(200).json(teamMembers);
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}