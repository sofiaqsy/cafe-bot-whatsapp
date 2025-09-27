#!/bin/bash

echo "☕ Actualizando bot de WhatsApp con soporte de imágenes..."

# Verificar si estamos en el directorio correcto
if [ ! -f "bot-mejorado.js" ]; then
    echo "❌ Error: No se encuentra bot-mejorado.js"
    echo "   Asegúrate de estar en el directorio cafe-bot-local"
    exit 1
fi

# Hacer backup del bot actual
echo "📦 Creando backup del bot actual..."
cp bot.js bot-backup-$(date +%Y%m%d-%H%M%S).js

# Reemplazar el bot actual con el mejorado
echo "🔄 Actualizando bot.js con la versión mejorada..."
cp bot-mejorado.js bot.js

# Verificar si está configurado Git
if [ ! -d ".git" ]; then
    echo "⚠️  No se detectó repositorio Git"
    echo "   Inicializando repositorio..."
    git init
    heroku git:remote -a cafe-bot-whatsapp
fi

# Commit y push a Heroku
echo "📤 Subiendo cambios a Heroku..."
git add .
git commit -m "Actualización: Soporte completo de imágenes para comprobantes de pago

- Agregado manejo de MediaUrl en webhook
- Implementada descarga y almacenamiento de imágenes
- Mejorado flujo de pago con comprobantes
- Agregado estado de pago en pedidos
- Panel admin mejorado con información de comprobantes"

git push heroku main

echo "✅ Bot actualizado exitosamente"
echo ""
echo "📋 Nuevas características:"
echo "   - Recepción de imágenes de comprobantes"
echo "   - Almacenamiento local de imágenes"
echo "   - Flujo de pago mejorado"
echo "   - Panel admin con estado de pagos"
echo ""
echo "🔧 Para probar:"
echo "   1. Envía 'hola' por WhatsApp"
echo "   2. Haz un pedido completo"
echo "   3. Cuando se solicite, envía una imagen del comprobante"
echo ""
echo "📊 Verifica el panel admin en:"
echo "   https://cafe-bot-whatsapp-ad7ab21dc0a8.herokuapp.com/admin"
