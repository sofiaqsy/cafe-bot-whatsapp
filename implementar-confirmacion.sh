#!/bin/bash

echo "============================================"
echo "🔄 FLUJO MEJORADO: CONFIRMACIÓN DE DATOS"
echo "============================================"
echo ""
echo "NUEVA EXPERIENCIA PARA CLIENTES RECURRENTES:"
echo "---------------------------------------------"
echo ""
echo "CLIENTE NUEVO (Primera vez):"
echo "1. Pide todos los datos"
echo "2. Los guarda para futuras compras"
echo ""
echo "CLIENTE CONOCIDO (2da vez en adelante):"
echo "1. Muestra los datos guardados"
echo "2. Pregunta: '¿Los datos son correctos?'"
echo "3. Opciones:"
echo "   ✅ SI - Continuar al pago"
echo "   ✏️ MODIFICAR - Actualizar cualquier dato"
echo "   ❌ NO - Cancelar"
echo ""
echo "============================================"
echo ""
echo "EJEMPLO DE FLUJO PARA CLIENTE CONOCIDO:"
echo "----------------------------------------"
echo ""
cat << 'EJEMPLO'
📋 CONFIRMA TUS DATOS
━━━━━━━━━━━━━━━━━

🏢 Empresa: Cafetería Central
👤 Contacto: Juan Pérez
📱 Teléfono: 987654321
📍 Dirección: Av. Principal 123, Miraflores

━━━━━━━━━━━━━━━━━

¿Los datos son correctos?

✅ Envía SI para continuar
✏️ Envía MODIFICAR para actualizar
❌ Envía NO para cancelar
EJEMPLO
echo ""
echo "============================================"
echo ""
echo "SI ELIGE MODIFICAR:"
echo "-------------------"
echo ""
cat << 'MODIFICAR'
✏️ MODIFICAR DATOS

¿Qué dato deseas modificar?

1 - Empresa/Negocio
2 - Nombre de contacto
3 - Teléfono
4 - Dirección
5 - Todos los datos

Envía el número de tu elección
MODIFICAR
echo ""
echo "============================================"
echo ""
echo "BENEFICIOS DEL NUEVO FLUJO:"
echo "---------------------------"
echo "✅ Clientes no repiten datos innecesariamente"
echo "✅ Pueden actualizar solo lo que cambió"
echo "✅ Proceso más rápido y profesional"
echo "✅ Mejor experiencia de usuario"
echo "✅ Datos siempre actualizados"
echo ""
echo "============================================"
echo ""
echo "MENSAJES PERSONALIZADOS POR HISTORIAL:"
echo "---------------------------------------"
echo ""
echo "2-4 pedidos:"
echo "😊 ¡Qué gusto verte de nuevo!"
echo "Este será tu pedido #3"
echo ""
echo "5-9 pedidos:"
echo "⭐ ¡Bienvenido nuevamente!"
echo "Ya son 7 pedidos con nosotros"
echo ""
echo "10+ pedidos (VIP):"
echo "🌟 ¡Hola de nuevo, cliente VIP!"
echo "Gracias por tu preferencia (15 pedidos)"
echo ""
echo "============================================"
echo ""
echo "PARA IMPLEMENTAR:"
echo "-----------------"
echo ""
echo "1. Los nuevos casos están en: flujo-confirmacion-datos.js"
echo "2. Agregar estos casos a bot-final.js"
echo "3. Reemplazar google-sheets.js con google-sheets-mejorado.js"
echo ""
echo "git add flujo-confirmacion-datos.js google-sheets.js bot-final.js"
echo "git commit -m 'Flujo mejorado con confirmación de datos"
echo ""
echo "- Muestra datos guardados para confirmar"
echo "- Permite modificar datos individualmente"
echo "- Mensajes personalizados por historial"
echo "- Mejor UX para clientes recurrentes'"
echo ""
echo "git push heroku main"
echo ""
echo "============================================"
