#!/bin/bash

echo "==========================================="
echo "🚀 DEPLOY FINAL COMPLETO"
echo "==========================================="
echo ""
echo "ARCHIVOS CREADOS:"
echo "-----------------"
echo "✅ sheets-funciones-corregidas.js - Guardar con columnas correctas"
echo "✅ sheets-lectura-datos.js - Leer clientes y pedidos de Sheets"
echo "✅ bot-final.js - Modificado con imports"
echo ""
echo "==========================================="
echo ""
echo "FUNCIONALIDADES IMPLEMENTADAS:"
echo "-------------------------------"
echo ""
echo "1. CLIENTES RECURRENTES:"
echo "   - Busca datos en hoja Clientes"
echo "   - No pide datos si ya existe"
echo "   - Permite confirmar o modificar"
echo ""
echo "2. PEDIDOS ACTIVOS EN MENÚ:"
echo "   - Lee de PedidosWhatsApp"
echo "   - Muestra solo pedidos no completados"
echo "   - Con estado y tiempo transcurrido"
echo ""
echo "3. GUARDADO CORRECTO:"
echo "   - PedidosWhatsApp: 20 columnas (A-T)"
echo "   - Clientes: 15 columnas (A-O)"
echo "   - Estado en columna O"
echo "   - WhatsApp en columna T"
echo ""
echo "==========================================="
echo ""
echo "ACTUALIZAR BOT-FINAL.JS MANUALMENTE:"
echo "-------------------------------------"
echo ""
echo "EN EL CASO 'confirmar_pedido', reemplazar con:"
echo ""
cat << 'CODE'
case 'confirmar_pedido':
    if (mensaje.toLowerCase() === 'si' || mensaje.toLowerCase() === 'sí') {
        // Buscar si el cliente ya existe en Google Sheets
        let datosClienteExistente = null;
        
        if (sheetsConfigured && googleSheets && googleSheets.initialized) {
            datosClienteExistente = await buscarClienteEnSheets(googleSheets, from);
        }
        
        // Si no está en Sheets, buscar en memoria local
        if (!datosClienteExistente) {
            datosClienteExistente = datosClientes.get(from);
        }
        
        if (datosClienteExistente) {
            // Cliente conocido - Mostrar datos para confirmar
            userState.data = {
                ...userState.data,
                empresa: datosClienteExistente.empresa,
                contacto: datosClienteExistente.contacto,
                telefono: datosClienteExistente.telefono || datosClienteExistente.whatsapp,
                direccion: datosClienteExistente.direccion
            };
            
            respuesta = `📋 *CONFIRMA TUS DATOS DE ENTREGA*
━━━━━━━━━━━━━━━━━

🏪 *Empresa:* ${datosClienteExistente.empresa}
👤 *Contacto:* ${datosClienteExistente.contacto}
📱 *Teléfono:* ${datosClienteExistente.telefono || datosClienteExistente.whatsapp}
📍 *Dirección:* ${datosClienteExistente.direccion}

━━━━━━━━━━━━━━━━━

¿Los datos son correctos?

✅ Envía *SI* para continuar al pago
✏️ Envía *MODIFICAR* para actualizar datos
❌ Envía *NO* para cancelar pedido`;
            
            userState.step = 'confirmar_datos_cliente';
        } else {
            // Cliente nuevo - pedir datos
            respuesta = `👤 *DATOS DEL CLIENTE*

Por favor, ingresa el *nombre de tu empresa o negocio*:`;
            userState.step = 'datos_empresa';
        }
    }
    // ... resto del caso
    break;

case 'confirmar_datos_cliente':
    if (mensaje.toLowerCase() === 'si' || mensaje.toLowerCase() === 'sí') {
        // Datos confirmados, proceder al pago
        respuesta = `✅ *PEDIDO CONFIRMADO*

Usando tus datos registrados:
🏪 ${userState.data.empresa}
📍 ${userState.data.direccion}

━━━━━━━━━━━━━━━━━

*MÉTODO DE PAGO*
💳 Realiza la transferencia a:

*Cuenta BCP Soles:*
*${BUSINESS_CONFIG.bcp_cuenta}*

*Cuenta Interbancaria (CCI):*
*${BUSINESS_CONFIG.cci_cuenta}*

━━━━━━━━━━━━━━━━━

💰 *Monto a transferir: ${formatearPrecio(userState.data.total)}*

📸 *Una vez realizada la transferencia, envía la foto del voucher o comprobante*`;
        
        userState.step = 'esperando_comprobante';
    } else if (mensaje.toLowerCase() === 'modificar') {
        // Permitir modificar datos
        respuesta = `✏️ *MODIFICAR DATOS*

¿Qué dato deseas modificar?

*1* - Empresa/Negocio
*2* - Nombre de contacto
*3* - Teléfono
*4* - Dirección
*5* - Todos los datos

Envía el número de tu elección`;
        
        userState.step = 'seleccionar_dato_modificar';
    }
    break;
CODE
echo ""
echo "==========================================="
echo ""
echo "COMANDOS PARA DEPLOY:"
echo "---------------------"
echo ""
echo "git add bot-final.js sheets-funciones-corregidas.js sheets-lectura-datos.js"
echo ""
echo 'git commit -m "Sistema completo con lectura de clientes y pedidos'
echo ""
echo "- Busca clientes existentes en Sheets"
echo "- Muestra pedidos activos en el menú"
echo "- Permite confirmar o modificar datos"
echo "- No pide datos a clientes conocidos"
echo '- Columnas correctas A-T y A-O"'
echo ""
echo "git push heroku main"
echo ""
echo "==========================================="
echo ""
echo "VERIFICAR DESPUÉS:"
echo "-------------------"
echo ""
echo "1. Cliente nuevo:"
echo "   - Pide todos los datos"
echo "   - Los guarda en Clientes"
echo ""
echo "2. Cliente conocido:"
echo "   - Muestra datos para confirmar"
echo "   - Permite modificar si necesario"
echo ""
echo "3. Menú principal:"
echo "   - Muestra pedidos activos arriba"
echo "   - Con estados y tiempos"
echo ""
echo "==========================================="
