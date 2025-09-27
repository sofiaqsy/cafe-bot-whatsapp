#!/bin/bash

echo "====================================================="
echo "🔔 CONFIGURACIÓN DE VALIDACIÓN DE COMPROBANTES"
echo "====================================================="
echo ""
echo "Este sistema notifica al administrador cuando llega un"
echo "comprobante para que lo valide en BCP antes de confirmar"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 PASO 1: CREAR GRUPO DE VALIDACIÓN"
echo "────────────────────────────────────"
echo "1. Crea un grupo en WhatsApp llamado 'VALIDAR PAGOS CAFÉ'"
echo "2. Agrega a las personas que validarán pagos"
echo "3. Agrega el número del bot: +14155238886"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔍 PASO 2: OBTENER ID DEL GRUPO"
echo "────────────────────────────────"
echo "1. Desde el grupo, envía cualquier mensaje (ej: 'test')"
echo "2. Revisa los logs de Heroku:"
echo "   heroku logs --tail -a cafe-bot-whatsapp"
echo ""
echo "3. Busca una línea como esta:"
echo "   📨 Mensaje recibido de whatsapp:+14155238886-1234567890@g.us"
echo ""
echo "4. Copia el ID completo: whatsapp:+14155238886-1234567890@g.us"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚙️ PASO 3: CONFIGURAR EN HEROKU"
echo "────────────────────────────────"
echo "Ejecuta este comando con el ID que obtuviste:"
echo ""
echo "heroku config:set WHATSAPP_ADMIN_GROUP='whatsapp:+14155238886-XXXXXXXXXX@g.us' -a cafe-bot-whatsapp"
echo ""
echo "Opcional - También a tu número personal:"
echo "heroku config:set WHATSAPP_ADMIN_NUMBER='whatsapp:+51999999999' -a cafe-bot-whatsapp"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📤 PASO 4: SUBIR CAMBIOS"
echo "────────────────────────────────"
echo "git add notification-service.js integracion-validacion.js"
echo "git commit -m 'Agregar sistema de validación de comprobantes'"
echo "git push heroku main"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 EJEMPLO DE NOTIFICACIÓN QUE RECIBIRÁS:"
echo "────────────────────────────────────────────"
cat << 'EXAMPLE'
⚠️ VALIDAR COMPROBANTE
━━━━━━━━━━━━━
🕐 Hora: 14:30
📋 Pedido: CAF-123456

CLIENTE:
🏢 Cafetería Central
👤 Juan Pérez
📱 +51987654321

MONTO A VALIDAR:
💰 S/1000

📸 Comprobante recibido
🔗 Ver imagen: [link a Drive]

ACCIONES REQUERIDAS:
1️⃣ Verificar en BCP/App
2️⃣ Confirmar monto: S/1000
3️⃣ Responder: ✅ si está OK

⏰ Validar en máx. 30 min
EXAMPLE
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ CÓMO VALIDAR UN PAGO:"
echo "────────────────────────────────"
echo "1. Recibes la notificación en el grupo"
echo "2. Verificas en BCP que llegó el dinero"
echo "3. Respondes en el grupo: '✅ CAF-123456 verificado'"
echo "4. El bot notifica automáticamente al cliente"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 TIPS IMPORTANTES:"
echo "────────────────────────────────"
echo "• Las notificaciones llegan SOLO cuando hay comprobante"
echo "• El administrador debe validar en máx. 30 minutos"
echo "• El cliente recibe confirmación automática"
echo "• Si hay dudas, contactar directamente al cliente"
echo ""
echo "====================================================="
