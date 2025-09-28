#!/bin/bash

echo "=========================================="
echo "📊 IMPLEMENTACIÓN DE GESTIÓN DE CLIENTES"
echo "=========================================="
echo ""
echo "Esta actualización agrega:"
echo "✅ Nueva pestaña 'Clientes' en Google Sheets"
echo "✅ Registro automático de clientes"
echo "✅ No pedir datos en pedidos repetidos"
echo "✅ Mensajes personalizados para clientes VIP"
echo "✅ Estadísticas de compras por cliente"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "PASO 1: REEMPLAZAR ARCHIVO DE GOOGLE SHEETS"
echo "--------------------------------------------"
echo "mv google-sheets.js google-sheets-old.js"
echo "mv google-sheets-mejorado.js google-sheets.js"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "PASO 2: ACTUALIZAR BOT-FINAL.JS"
echo "--------------------------------"
echo "Agregar en la sección de 'confirmar_pedido':"
echo ""
cat << 'CODE'
// Buscar si el cliente ya existe en Sheets
let datosClienteGuardado = null;

if (sheetsConfigured && googleSheets && googleSheets.buscarCliente) {
    try {
        const estadisticasCliente = await googleSheets.obtenerEstadisticasCliente(from);
        
        if (estadisticasCliente.existe) {
            datosClienteGuardado = {
                empresa: estadisticasCliente.empresa,
                contacto: estadisticasCliente.contacto,
                telefono: estadisticasCliente.telefonoContacto,
                direccion: estadisticasCliente.direccion
            };
            
            // Mensaje personalizado según historial
            if (estadisticasCliente.totalPedidos >= 5) {
                respuesta = '🌟 ¡Bienvenido de nuevo, cliente VIP!\n\n';
            } else if (estadisticasCliente.totalPedidos >= 2) {
                respuesta = '😊 ¡Qué bueno verte de nuevo!\n\n';
            }
            
            respuesta += `Usando tus datos registrados:\n`;
            respuesta += `🏢 ${datosClienteGuardado.empresa}\n`;
            respuesta += `📍 ${datosClienteGuardado.direccion}\n\n`;
            respuesta += `🏆 Este es tu pedido número ${estadisticasCliente.totalPedidos + 1}\n\n`;
            
            // Ir directo al pago...
        }
    } catch (error) {
        console.log('⚠️ No se pudo verificar cliente en Sheets');
    }
}
CODE
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "PASO 3: HACER PUSH"
echo "------------------"
echo "git add google-sheets-mejorado.js"
echo "git add bot-final.js"
echo "git commit -m 'Agregar gestión inteligente de clientes"
echo ""
echo "- Nueva pestaña Clientes en Sheets"
echo "- Registro automático de clientes"
echo "- No pedir datos repetidos"
echo "- Mensajes personalizados para VIP"
echo "- Estadísticas de compras'"
echo ""
echo "git push heroku main"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "BENEFICIOS:"
echo "-----------"
echo "✅ Primera compra: Pide todos los datos"
echo "✅ Segunda compra: Usa datos guardados automáticamente"
echo "✅ Cliente VIP (5+ pedidos): Mensaje de bienvenida especial"
echo "✅ Historial completo en pestaña Clientes"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "ESTRUCTURA DE LA PESTAÑA CLIENTES:"
echo "-----------------------------------"
echo "• ID Cliente"
echo "• WhatsApp"
echo "• Empresa/Negocio"
echo "• Nombre Contacto"
echo "• Teléfono"
echo "• Email"
echo "• Dirección"
echo "• Distrito"
echo "• Ciudad"
echo "• Fecha Registro"
echo "• Última Compra"
echo "• Total Pedidos"
echo "• Total Comprado (S/)"
echo "• Total Kg"
echo "• Notas"
echo ""
echo "=========================================="
