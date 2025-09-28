#!/bin/bash
# Script de despliegue para la limpieza de emoticonos

echo "========================================="
echo "DESPLEGANDO VERSIÓN SIMPLIFICADA"
echo "========================================="
echo ""

# Ir al directorio del proyecto
cd "/Users/keylacusi/Desktop/OPEN IA/cafe-bots/cafe-bot-local"

# Agregar cambios
echo "Agregando cambios..."
git add order-handler.js google-sheets.js

# Crear commit
echo "Creando commit..."
git commit -m "refactor: Simplificar mensajes y eliminar emoticonos innecesarios

- Eliminados emoticonos decorativos en los mensajes
- Simplificado el mensaje de comprobante recibido
- Eliminada la URL del dashboard en el mensaje de confirmación
- Mantenidos solo emoticonos esenciales (✅ para confirmación)
- Mensajes más limpios y profesionales"

echo ""
echo "Haciendo push a GitHub..."
git push origin main

echo ""
echo "Desplegando a Heroku..."
git push heroku main

echo ""
echo "========================================="
echo "DESPLIEGUE COMPLETADO"
echo "========================================="
echo ""
echo "Cambios aplicados:"
echo "1. Mensajes sin emoticonos innecesarios"
echo "2. Mensaje de comprobante simplificado"
echo "3. Sin URL del dashboard"
echo "4. Textos más limpios y directos"
echo ""
echo "Para ver los logs:"
echo "  heroku logs --tail -a cafe-bot-whatsapp-ad7ab21dc0a8"
