
export const printOrder = (order: any, establishmentName: string = "Noia Burguer") => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = order.items.map((item: any) => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span style="flex: 1;">${item.quantity}x ${item.name}</span>
            <span style="flex: 0; white-space: nowrap;">R$ ${Number(item.total).toFixed(2).replace('.', ',')}</span> 
        </div>
        ${item.notes ? `<div style="font-size: 12px; margin-left: 10px; margin-bottom: 5px;">* ${item.notes}</div>` : ''}
        ${Array.isArray(item.addons) ? item.addons.map((addon: any) => {
        const addonName = addon.name || addon.item?.name || '';
        return addonName ? `<div style="font-size: 12px; margin-left: 10px;">+ ${addonName}</div>` : '';
    }).join('') : ''}
    `).join('');

    const addressHtml = order.type === 'DELIVERY' && order.delivery_address
        ? (() => {
            const addr = typeof order.delivery_address === 'string' ? JSON.parse(order.delivery_address) : order.delivery_address;
            return `
            <div class="section" style="border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px;">
                <strong>Endereço de Entrega:</strong><br/>
                ${addr.street}, ${addr.number}<br/>
                ${addr.neighborhood}<br/>
                ${addr.city || ''}
            </div>`;
        })()
        : '';

    const html = `
    <html>
        <head>
            <title>Pedido #${order.order_number || order.id}</title>
            <style>
                @page { size: 80mm auto; margin: 0; }
                body { font-family: 'Courier New', monospace; width: 80mm; margin: 0; padding: 10px; font-size: 14px; line-height: 1.2; color: #000; font-weight: 600; }
                .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
                .title { font-size: 18px; font-weight: 800; }
                .info { margin-bottom: 10px; }
                .items { margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
                .total { text-align: right; font-size: 16px; font-weight: 800; margin-top: 10px; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; }
                strong { font-weight: 800; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">${establishmentName}</div>
                <div>${new Date().toLocaleString('pt-BR')}</div>
            </div>
            
            <div class="info">
                <strong>Pedido: #${order.order_number || order.id}</strong><br/>
                Tipo: ${order.type === 'DELIVERY' ? 'ENTREGA' : order.type === 'DINE_IN' ? 'MESA' : 'RETIRADA'}<br/>
                ${order.table_number ? `Mesa: ${order.table_number}<br/>` : ''}
                Cliente: ${order.customer_name}<br/>
                Telefone: ${order.customer_phone || 'N/A'}
            </div>

            ${addressHtml}

            <div class="items">
                <strong>ITENS</strong><br/><br/>
                ${itemsHtml}
            </div>

            ${order.type === 'DELIVERY' ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px; border-bottom: 1px dashed #000; padding-bottom: 5px;">
                <span>Taxa de Entrega:</span>
                <span>R$ ${Number(order.delivery_fee || 0).toFixed(2).replace('.', ',')}</span>
            </div>` : ''}

            <div class="total">
                TOTAL: R$ ${Number(order.total_amount).toFixed(2).replace('.', ',')}
            </div>
            
            ${order.payment_method ? `
            <div style="margin-top: 5px; text-align: right; font-size: 12px;">
                Pagamento: ${order.payment_method === 'money' ? 'Dinheiro' : order.payment_method === 'card' ? 'Cartão' : 'Pix'}
                ${order.change_for ? `<br/>Troco para: R$ ${Number(order.change_for).toFixed(2).replace('.', ',')}` : ''}
            </div>` : ''}

            <div class="footer">
                Obrigado pela preferência!<br/>
                Volte sempre.
            </div>
            
            <script>
                window.onload = function() { window.print(); window.close(); }
            </script>
        </body>
    </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
};
