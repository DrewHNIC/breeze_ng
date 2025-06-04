import { useRef } from 'react';
import { Order } from './OrderManagement';

interface OrderReceiptProps {
  order: Order;
}

export default function OrderReceipt({ order }: OrderReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = () => {
    const content = receiptRef.current;
    if (!content) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print receipts');
      return;
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Order Receipt #${order.id.slice(0, 8)}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              max-width: 300px;
              margin: 0 auto;
            }
            .receipt {
              border: 1px solid #ddd;
              padding: 15px;
            }
            .header {
              text-align: center;
              margin-bottom: 15px;
              border-bottom: 1px dashed #ddd;
              padding-bottom: 10px;
            }
            .info {
              margin-bottom: 15px;
              font-size: 12px;
            }
            .items {
              margin-bottom: 15px;
              border-bottom: 1px dashed #ddd;
              padding-bottom: 10px;
            }
            .item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
              font-size: 12px;
            }
            .total {
              font-weight: bold;
              display: flex;
              justify-content: space-between;
              margin-top: 10px;
              font-size: 14px;
            }
            .footer {
              text-align: center;
              margin-top: 15px;
              font-size: 12px;
            }
            @media print {
              body {
                width: 100%;
                max-width: 300px;
              }
            }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Print after a short delay to ensure content is loaded
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };
  
  // Format date for receipt
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Calculate subtotal
  const calculateSubtotal = () => {
    if (!order.items || order.items.length === 0) return 0;
    return order.items.reduce((sum, item) => sum + (item.price_per_item * item.quantity), 0);
  };
  
  // Calculate delivery fee
  const calculateDeliveryFee = () => {
    const subtotal = calculateSubtotal();
    const fee = subtotal * 0.1;
    return Math.min(Math.max(fee, 2), 10);
  };

  return (
    <div>
      <button
        onClick={handlePrint}
        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        Print Receipt
      </button>
      
      {/* Hidden receipt content for printing */}
      <div className="hidden">
        <div ref={receiptRef} className="receipt">
          <div className="header">
            <h2>Food Delivery</h2>
            <p>Order #{order.id.slice(0, 8)}</p>
            <p>{formatDate(order.created_at)}</p>
          </div>
          
          <div className="info">
            <p><strong>Customer:</strong> {order.customer_name}</p>
            <p><strong>Phone:</strong> {order.contact_number}</p>
            <p><strong>Address:</strong> {order.delivery_address}</p>
            {order.special_instructions && (
              <p><strong>Instructions:</strong> {order.special_instructions}</p>
            )}
          </div>
          
          <div className="items">
            <p><strong>Items:</strong></p>
            {order.items?.map((item) => (
              <div key={item.id} className="item">
                <span>{item.quantity}x {item.menu_item_name}</span>
                <span>${(item.quantity * item.price_per_item).toFixed(2)}</span>
              </div>
            ))}
          </div>
          
          <div>
            <div className="item">
              <span>Subtotal:</span>
              <span>${calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className="item">
              <span>Delivery Fee:</span>
              <span>${calculateDeliveryFee().toFixed(2)}</span>
            </div>
            <div className="total">
              <span>Total:</span>
              <span>${order.total_amount.toFixed(2)}</span>
            </div>
            <div className="item">
              <span>Payment Method:</span>
              <span>{order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1)}</span>
            </div>
            <div className="item">
              <span>Payment Status:</span>
              <span>{order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}</span>
            </div>
          </div>
          
          <div className="footer">
            <p>Thank you for your order!</p>
          </div>
        </div>
      </div>
    </div>
  );
}