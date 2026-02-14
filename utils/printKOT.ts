
import { Order, RestaurantSettings } from '../types';

export const printKOT = (order: Order, settings: RestaurantSettings) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Please allow popups to print KOT");
    return;
  }

  const itemsHtml = (order.items || []).map(item => `
    <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px;">
      <span style="font-weight: bold;">${item.quantity}x ${item.name} ${item.portionType ? `(${item.portionType})` : ''}</span>
      <span>${(item.price * item.quantity).toFixed(0)}</span>
    </div>
  `).join('');

  const timeString = new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = new Date(order.timestamp).toLocaleDateString();

  const htmlContent = `
    <html>
      <head>
        <title>KOT - ${order.id}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body {
            font-family: 'Courier New', monospace;
            width: 76mm; /* 2mm margin */
            margin: 2mm;
            padding: 0;
            color: #000;
          }
          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 10px; }
          .title { font-size: 16px; font-weight: bold; text-transform: uppercase; }
          .meta { font-size: 12px; margin-top: 5px; }
          .type-tag { 
            display: inline-block; 
            background: #000; 
            color: #fff; 
            padding: 2px 6px; 
            border-radius: 4px; 
            font-weight: bold; 
            font-size: 14px;
            margin-top: 5px;
          }
          .items { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
          .total { text-align: right; font-size: 14px; font-weight: bold; margin-bottom: 10px; }
          .footer { text-align: center; font-size: 10px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${settings.name}</div>
          <div class="meta">Date: ${dateString} | Time: ${timeString}</div>
          <div class="meta">Order ID: #${order.id.slice(-6)}</div>
          <div class="type-tag">${order.orderType.toUpperCase()}</div>
          ${order.tableNumber ? `<div style="font-size: 14px; font-weight: bold; margin-top: 5px;">Table: ${order.tableNumber}</div>` : ''}
          <div style="font-size: 14px; font-weight: bold; margin-top: 5px;">${order.customerName}</div>
          ${order.orderType === 'delivery' && order.address ? `
            <div style="font-size: 11px; margin-top: 4px; padding: 4px 6px; border: 1px dashed #000; border-radius: 4px;">
              <strong>📍 Delivery Address:</strong><br/>
              ${order.address}
            </div>
          ` : ''}
          ${order.orderType === 'delivery' && order.customerPhone ? `
            <div style="font-size: 12px; margin-top: 3px; font-weight: bold;">📞 ${order.customerPhone}</div>
          ` : ''}
        </div>

        <div class="items">
          ${itemsHtml}
        </div>

        <div class="total">
          Total: ₹${order.totalAmount.toFixed(0)}
        </div>

        <div class="footer">
          *** KITCHEN COPY ***<br/>
          Powered by Laoo
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
