#!/bin/bash
# Script de despliegue de emergencia

echo "========================================="
echo "DESPLIEGUE DE EMERGENCIA - FIX RÁPIDO"
echo "========================================="
echo ""

# Ir al directorio del proyecto
cd "/Users/keylacusi/Desktop/OPEN IA/cafe-bots/cafe-bot-local"

# Ver estado de Git
echo "Estado actual:"
git status --short

# Agregar todos los cambios
echo ""
echo "Agregando cambios..."
git add .

# Hacer commit
echo "Creando commit..."
git commit -m "fix: Corregir error de sintaxis y simplificar mensajes

- Corregido archivo order-handler.js
- Eliminados emoticonos innecesarios
- Mensaje de comprobante simplificado
- Compatibilidad con WhatsApp mejorada"

# Push a GitHub
echo ""
echo "Push a GitHub..."
git push origin main --force

# Push a Heroku
echo ""
echo "Push a Heroku..."
git push heroku main --force

echo ""
echo "========================================="
echo "DESPLIEGUE COMPLETADO"
echo "========================================="
echo ""
echo "Verificando estado en Heroku..."
heroku logs --tail -n 50 -a cafe-bot-whatsapp-ad7ab21dc0a8
