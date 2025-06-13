import { Heart, Award, ShoppingBag, Percent } from "lucide-react"

export default function LoyaltyExplainer() {
  return (
    <div className="bg-[#8f8578] rounded-lg shadow-md border border-[#1d2c36] p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center text-[#1d2c36]">
        <Heart className="h-5 w-5 mr-2 text-[#b9c6c8]" />
        BREEZE Loyalty Program
      </h2>

      <p className="text-[#1d2c36] mb-6">Earn points with every order and enjoy exclusive rewards and discounts!</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1d2c36] rounded-lg p-4 border border-[#b9c6c8]">
          <div className="bg-[#8f8578] h-12 w-12 rounded-full flex items-center justify-center mb-4">
            <ShoppingBag className="h-6 w-6 text-[#b9c6c8]" />
          </div>
          <h3 className="font-bold mb-2 text-[#8f8578]">Earn Points</h3>
          <p className="text-sm text-[#8f8578] text-opacity-80">
            Get 1 loyalty point for every order you place through BREEZE.
          </p>
        </div>

        <div className="bg-[#1d2c36] rounded-lg p-4 border border-[#b9c6c8]">
          <div className="bg-[#8f8578] h-12 w-12 rounded-full flex items-center justify-center mb-4">
            <Percent className="h-6 w-6 text-[#b9c6c8]" />
          </div>
          <h3 className="font-bold mb-2 text-[#8f8578]">Redeem Rewards</h3>
          <p className="text-sm text-[#8f8578] text-opacity-80">
            Use 10 points to get a 50% discount on your next order at checkout.
          </p>
        </div>

        <div className="bg-[#1d2c36] rounded-lg p-4 border border-[#b9c6c8]">
          <div className="bg-[#8f8578] h-12 w-12 rounded-full flex items-center justify-center mb-4">
            <Award className="h-6 w-6 text-[#b9c6c8]" />
          </div>
          <h3 className="font-bold mb-2 text-[#8f8578]">No Expiration</h3>
          <p className="text-sm text-[#8f8578] text-opacity-80">
            Your loyalty points never expire, so you can save them for when you need them.
          </p>
        </div>
      </div>
    </div>
  )
}
