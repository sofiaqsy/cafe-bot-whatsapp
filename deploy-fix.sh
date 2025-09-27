#!/bin/bash

echo "🚀 Desplegando actualización con soporte de imágenes..."
echo ""

# Hacer commit de los cambios
git add google-drive-service.js
git commit -m "Fix: Mejorar manejo de errores en Google Drive Service

- Soporte para almacenamiento local como fallback
- Manejo robusto de errores de conexión
- Compatible con ambas variables DRIVE_FOLDER_ID y DRIVE_COMPROBANTES_ID
- Continúa funcionando incluso si Drive falla"

# Push a Heroku
git push heroku main

echo ""
echo "✅ Actualización completada"
echo ""
echo "📋 Cambios implementados:"
echo "   - Google Drive Service mejorado"
echo "   - Fallback a almacenamiento local si Drive falla"
echo "   - El bot ya maneja imágenes en el webhook"
echo "   - Comprobantes se guardan automáticamente"
echo ""
echo "🧪 Para verificar:"
echo "   heroku logs --tail -a cafe-bot-whatsapp"
echo ""
echo "📸 El bot ahora puede:"
echo "   1. Recibir imágenes de comprobantes"
echo "   2. Guardarlas en Drive (si funciona) o localmente"
echo "   3. Confirmar el pedido automáticamente"
echo "   4. Mostrar el link de Drive si se sube exitosamente"
