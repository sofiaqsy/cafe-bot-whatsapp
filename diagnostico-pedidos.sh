#!/bin/bash

echo "==========================================="
echo "🔍 DIAGNÓSTICO: PEDIDOS NO VISIBLES"
echo "==========================================="
echo ""
echo "POSIBLES CAUSAS:"
echo "----------------"
echo ""
echo "1. COLUMNA T VACÍA:"
echo "   - Verificar que columna T tenga el WhatsApp"
echo "   - Debe ser el número sin 'whatsapp:'"
echo "   - Ejemplo: 935923492"
echo ""
echo "2. ESTADO INCORRECTO:"
echo "   - Columna O debe tener el estado"
echo "   - Si está vacío o dice 'Completado' no se muestra"
echo ""
echo "3. WHATSAPP NO COINCIDE:"
echo "   - El número en columna T debe ser EXACTO"
echo "   - Sin espacios, sin +51, sin caracteres extra"
echo ""
echo "==========================================="
echo ""
echo "SOLUCIÓN TEMPORAL PARA DEBUG:"
echo "------------------------------"
echo ""
echo "En bot-final.js, agregar después del caso 'inicio':"
echo ""
cat << 'CODE'
// DEBUG: Verificar pedidos
if (mensaje.toLowerCase() === 'debug pedidos') {
    if (sheetsConfigured && googleSheets) {
        const { verificarPedidosCliente } = require('./debug-pedidos');
        const resultado = await verificarPedidosCliente(googleSheets, from);
        
        respuesta = `🔍 DEBUG PEDIDOS\n\n`;
        respuesta += `Tu WhatsApp: ${from.replace('whatsapp:', '')}\n`;
        respuesta += `Pedidos encontrados: ${resultado.encontrados}\n`;
        respuesta += `Pedidos activos: ${resultado.pedidos.length}\n\n`;
        
        if (resultado.pedidos.length > 0) {
            respuesta += `PEDIDOS ACTIVOS:\n`;
            resultado.pedidos.forEach(p => {
                respuesta += `- ${p.id}: ${p.estado}\n`;
            });
        }
    } else {
        respuesta = 'Google Sheets no configurado';
    }
    break;
}
CODE
echo ""
echo "==========================================="
echo ""
echo "VERIFICACIÓN MANUAL EN SHEETS:"
echo "-------------------------------"
echo ""
echo "1. Abrir Google Sheets"
echo "2. Ir a PedidosWhatsApp"
echo "3. Verificar:"
echo "   - Columna O (Estado): NO debe estar vacía"
echo "   - Columna T (Usuario_WhatsApp): Debe tener el número"
echo ""
echo "4. Si columna T está vacía, llenarla manualmente con:"
echo "   - El número sin 'whatsapp:'"
echo "   - Sin +51"
echo "   - Ejemplo: 935923492"
echo ""
echo "==========================================="
echo ""
echo "CORRECCIÓN RÁPIDA:"
echo "------------------"
echo ""
echo "Si la columna T está vacía en pedidos antiguos:"
echo ""
echo "1. En Google Sheets, columna T, poner: 935923492"
echo "2. En columna O, poner: Pendiente verificación"
echo "3. Guardar cambios"
echo "4. Probar de nuevo con 'hola'"
echo ""
echo "==========================================="
