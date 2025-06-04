import React from 'react';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  image: string;
  orders: number;
  revenue: number;
}

interface TopProductsProps {
  products: Product[];
}

const TopProducts: React.FC<TopProductsProps> = ({ products }) => {
  return (
    <div className="bg-black-900 rounded-lg p-6">
      <h3 className="text-secondary text-lg font-semibold mb-6">Top Products</h3>
      <div className="space-y-4">
        {products.map((product) => (
          <div key={product.id} className="flex items-center gap-4">
            <div className="relative w-12 h-12">
              <Image
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                fill
                className="rounded-lg object-cover"
              />
            </div>
            <div className="flex-1">
              <h4 className="text-secondary font-medium">{product.name}</h4>
              <p className="text-gray-400 text-sm">{product.orders} orders</p>
            </div>
            <p className="text-secondary font-medium">₦{product.revenue.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopProducts;