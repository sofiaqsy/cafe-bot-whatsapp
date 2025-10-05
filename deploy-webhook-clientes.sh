#!/bin/bash

# Script para actualizar el webhook del bot de WhatsApp
# Agrega soporte para notificaciones de aprobación de clientes

echo "=========================================="
echo "🔧 ACTUALIZACIÓN: Webhook para Aprobación de Clientes"
echo "=========================================="
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "app.js" ] && [ ! -f "package.json" ]; then
    echo "❌ Error: No estás en el directorio cafe-bot-local"
    echo "   cd /Users/keylacusi/Desktop/OPEN IA/cafe-bots/cafe-bot-local"
    exit 1
fi

echo "📋 Esta actualización permite:"
echo "   ✅ Mantener notificaciones de pedidos existentes"
echo "   ✅ Agregar notificaciones de aprobación/rechazo de clientes"
echo "   ✅ Mensajes personalizados para Verificado/Rechazado"
echo "   ✅ Envío automático de catálogo a clientes verificados"
echo ""

# Hacer backup del webhook actual si existe
if [ -f "webhook-estado.js" ]; then
    echo "📦 Creando backup del webhook actual..."
    cp webhook-estado.js webhook-estado.backup-$(date +%Y%m%d-%H%M%S).js
fi

# Copiar el nuevo archivo
echo "📝 Actualizando webhook-estado.js..."
cp webhook-estado-actualizado.js webhook-estado.js

# Verificar que el archivo se copió correctamente
if [ $? -eq 0 ]; then
    echo "✅ Archivo actualizado correctamente"
else
    echo "❌ Error al actualizar archivo"
    exit 1
fi

# Confirmar antes de hacer deploy
echo ""
read -p "¿Deseas hacer deploy a Heroku? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "⚠️ Actualización local completada. No se hizo deploy."
    echo "   Para deploy manual: git push heroku main"
    exit 0
fi

# Git operations
echo ""
echo "📝 Agregando cambios a git..."
git add webhook-estado.js

echo "💾 Creando commit..."
git commit -m "feat: Agregar soporte para notificaciones de aprobación de clientes

- Webhook ahora maneja tipo 'aprobacion_cliente'
- Mensajes personalizados para Verificado/Rechazado
- Envío automático de catálogo a clientes verificados
- Mantiene funcionalidad existente de pedidos"

echo ""
echo "🚀 Desplegando a Heroku..."
git push heroku main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment exitoso!"
    echo ""
    echo "📊 Verificando estado..."
    heroku ps
    
    echo ""
    echo "📝 Logs recientes..."
    heroku logs --tail -n 20
    
    echo ""
    echo "=========================================="
    echo "✅ ACTUALIZACIÓN COMPLETADA"
    echo "=========================================="
    echo ""
    echo "📱 Para probar:"
    echo "   1. Ve a Google Sheets"
    echo "   2. Menú: 📦 Notificaciones WhatsApp"
    echo "   3. Tests → Test Aprobación Cliente"
    echo ""
    echo "💡 Tipos de notificación soportados:"
    echo "   - cambio_estado (pedidos)"
    echo "   - aprobacion_cliente (nuevo)"
else
    echo ""
    echo "❌ Error en deployment"
    echo "   Revisa: heroku logs --tail"
fi
