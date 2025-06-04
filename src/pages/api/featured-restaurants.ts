import type { NextApiRequest, NextApiResponse } from 'next';

// This is a mock database. In a real application, you would fetch this data from your actual database.
const featuredRestaurants = [
  {
    id: 1,
    name: "Dosh's Eats",
    cuisine: "Nigerian",
    rating: 4.5,
    price: "$$",
    image: "/restaurant-1.jpg"
  },
  {
    id: 2,
    name: "Ember's Cookhouse",
    cuisine: "Nigerian",
    rating: 4.7,
    price: "$$$",
    image: "/restaurant-2.jpg"
  },
  {
    id: 3,
    name: "Drew's",
    cuisine: "Nigerian",
    rating: 4.3,
    price: "$$",
    image: "/restaurant-3.jpg"
  }
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.status(200).json(featuredRestaurants);
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}