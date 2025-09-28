#!/bin/bash

# ========================================
# DEPLOY WEBHOOK DE ESTADO
# ========================================

echo "🔔 Desplegando Webhook de Estado para Google Sheets..."
echo "========================================"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No estás en el directorio del proyecto"
    exit 1
fi

echo "📝 FUNCIONALIDAD AGREGADA:"
echo "  1. Endpoint /webhook-estado para recibir cambios desde Sheets"
echo "  2. Notificaciones automáticas por WhatsApp"
echo "  3. Mensajes personalizados por estado"
echo ""

# Configurar variable de entorno en Heroku
echo "🔐 Configurando token secreto en Heroku..."
heroku config:set WEBHOOK_SECRET_TOKEN=test -a cafe-bot-whatsapp

# Git add, commit y push
echo ""
echo "📦 Preparando cambios para Heroku..."
git add app.js webhook-estado.js .env
git commit -m "feat: Agregar webhook de estado para notificaciones desde Google Sheets"

echo ""
echo "🚀 Enviando a Heroku..."
git push heroku main

echo ""
echo "⏳ Esperando que se reinicie la aplicación (30 segundos)..."
sleep 30

echo ""
echo "🧪 Verificando que el endpoint esté activo..."
curl -X GET https://cafe-bot-whatsapp-ad7ab21dc0a8.herokuapp.com/webhook-estado

echo ""
echo ""
echo "=========================================="
echo "✅ DESPLIEGUE COMPLETADO"
echo "=========================================="
echo ""
echo "📊 CONFIGURACIÓN EN GOOGLE SHEETS:"
echo "  1. Abre tu Google Sheet"
echo "  2. Ve a Extensiones > Apps Script"  
echo "  3. Copia el código de GOOGLE_APPS_SCRIPT_FIXED.gs"
echo "  4. Ejecuta 'Sincronizar Estados'"
echo "  5. Ejecuta 'Test Enviar Notificación'"
echo "  6. Si funciona, ejecuta 'Activar Sistema'"
echo ""
echo "🔔 ESTADOS QUE ENVÍAN NOTIFICACIÓN:"
echo "  • Pago confirmado"
echo "  • En preparación"
echo "  • En camino"
echo "  • Listo para recoger"
echo "  • Entregado"
echo ""
echo "📱 WEBHOOK URL:"
echo "  https://cafe-bot-whatsapp-ad7ab21dc0a8.herokuapp.com/webhook-estado"
echo ""
echo "🔐 TOKEN:"
echo "  test"
echo ""
echo "✨ El sistema enviará notificaciones automáticas cuando cambies el estado en Sheets!"
echo ""
