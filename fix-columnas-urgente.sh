#!/bin/bash

echo "================================================"
echo "🚨 FIX URGENTE: CORREGIR COLUMNAS EN SHEETS"
echo "================================================"
echo ""
echo "PROBLEMA:"
echo "---------"
echo "Los datos se están guardando en columnas incorrectas"
echo "La hoja Clientes está vacía"
echo ""
echo "SOLUCIÓN MANUAL INMEDIATA:"
echo "--------------------------"
echo ""
echo "1. REORGANIZAR ENCABEZADOS EN PEDIDOSWHATSAPP:"
echo "   A: ID_Pedido"
echo "   B: Fecha"
echo "   C: Hora"
echo "   D: Empresa"
echo "   E: Contacto"
echo "   F: Telefono"
echo "   G: Direccion"
echo "   H: Producto"
echo "   I: Cantidad_kg"
echo "   J: Precio_Unitario"
echo "   K: Subtotal"
echo "   L: Descuento"
echo "   M: Total"
echo "   N: Metodo_Pago"
echo "   O: Estado"
echo "   P: URL_Comprobante"
echo "   Q: Observaciones"
echo "   R: Tipo_Pedido"
echo "   S: ID_Cliente"
echo "   T: Usuario_WhatsApp"
echo ""
echo "2. CREAR ENCABEZADOS EN CLIENTES:"
echo "   A: ID_Cliente"
echo "   B: WhatsApp"
echo "   C: Empresa"
echo "   D: Nombre_Contacto"
echo "   E: Telefono_Contacto"
echo "   F: Email"
echo "   G: Direccion"
echo "   H: Distrito"
echo "   I: Ciudad"
echo "   J: Fecha_Registro"
echo "   K: Ultima_Compra"
echo "   L: Total_Pedidos"
echo "   M: Total_Comprado"
echo "   N: Total_Kg"
echo "   O: Notas"
echo ""
echo "================================================"
echo ""
echo "CÓDIGO CORREGIDO PARA BOT:"
echo "---------------------------"

cat << 'CODE'
// Función corregida para guardar pedido
async function guardarPedidoCorregido(datosPedido) {
    if (!googleSheets || !googleSheets.initialized) return false;
    
    try {
        const fecha = new Date();
        const fechaStr = fecha.toLocaleDateString('es-PE', { timeZone: 'America/Lima' });
        const horaStr = fecha.toLocaleTimeString('es-PE', { timeZone: 'America/Lima' });
        
        // Array de valores EN EL ORDEN CORRECTO
        const values = [[
            datosPedido.id,                           // A: ID_Pedido
            fechaStr,                                  // B: Fecha
            horaStr,                                   // C: Hora
            datosPedido.empresa || '',                // D: Empresa
            datosPedido.contacto || '',               // E: Contacto
            datosPedido.telefono || '',               // F: Telefono
            datosPedido.direccion || '',              // G: Direccion
            datosPedido.producto?.nombre || '',       // H: Producto
            datosPedido.cantidad || 0,                // I: Cantidad_kg
            datosPedido.producto?.precio || 0,        // J: Precio_Unitario
            datosPedido.cantidad * datosPedido.producto?.precio || 0, // K: Subtotal
            0,                                         // L: Descuento
            datosPedido.total || 0,                   // M: Total
            'Transferencia',                          // N: Metodo_Pago
            'Pendiente verificación',                 // O: Estado
            datosPedido.urlComprobante || '',         // P: URL_Comprobante
            datosPedido.observaciones || '',          // Q: Observaciones
            datosPedido.esReorden ? 'Reorden' : 'Nuevo', // R: Tipo_Pedido
            '',                                        // S: ID_Cliente (se llenará después)
            datosPedido.telefono.replace('whatsapp:', '') // T: Usuario_WhatsApp
        ]];
        
        const response = await googleSheets.sheets.spreadsheets.values.append({
            spreadsheetId: googleSheets.spreadsheetId,
            range: 'PedidosWhatsApp!A:T',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            requestBody: { values: values }
        });
        
        console.log('✅ Pedido guardado correctamente');
        return true;
    } catch (error) {
        console.error('Error guardando pedido:', error);
        return false;
    }
}
CODE

echo ""
echo "================================================"
echo ""
echo "PASOS A SEGUIR:"
echo "---------------"
echo ""
echo "1. DETENER EL BOT TEMPORALMENTE:"
echo "   heroku ps:scale web=0 -a cafe-bot-whatsapp"
echo ""
echo "2. CORREGIR MANUALMENTE EN GOOGLE SHEETS:"
echo "   - Reorganizar columnas de PedidosWhatsApp"
echo "   - Crear encabezados en Clientes"
echo "   - Mover datos existentes a columnas correctas"
echo ""
echo "3. ACTUALIZAR CÓDIGO:"
echo "   - Usar la función guardarPedidoCorregido"
echo "   - Verificar orden de columnas"
echo ""
echo "4. HACER PUSH:"
echo "   git add ."
echo "   git commit -m 'Fix: Corregir orden de columnas en Sheets'"
echo "   git push heroku main"
echo ""
echo "5. REINICIAR BOT:"
echo "   heroku ps:scale web=1 -a cafe-bot-whatsapp"
echo ""
echo "================================================"
