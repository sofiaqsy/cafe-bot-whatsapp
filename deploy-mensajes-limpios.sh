#!/bin/bash
# Script de despliegue - Mensajes completamente simplificados

echo "========================================="
echo "DESPLIEGUE FINAL - MENSAJES LIMPIOS"
echo "========================================="
echo ""

# Ir al directorio del proyecto
cd "/Users/keylacusi/Desktop/OPEN IA/cafe-bots/cafe-bot-local"

# Ver estado
echo "Estado actual de Git:"
git status --short
echo ""

# Agregar cambios
echo "Agregando todos los cambios..."
git add .

# Commit
echo "Creando commit..."
git commit -m "fix: Eliminar todos los emoticonos innecesarios de los mensajes

CAMBIOS IMPLEMENTADOS:
- Mensaje de comprobante recibido completamente simplificado
- Sin emoticonos decorativos en ningún mensaje
- Solo se mantiene check (✅) para confirmaciones esenciales
- Mensajes más profesionales y limpios
- Mejor legibilidad en WhatsApp

FUNCIONALIDADES COMPLETAS:
- Búsqueda de clientes compatible con ambos formatos
- Actualización automática de stock
- Sincronización de catálogo en memoria
- Validación de stock antes de confirmar
- Clientes no repiten datos
- Mensajes limpios y directos"

# Push a GitHub
echo ""
echo "Push a GitHub..."
git push origin main

# Push a Heroku
echo ""
echo "Push a Heroku..."
git push heroku main

echo ""
echo "========================================="
echo "DESPLIEGUE COMPLETADO"
echo "========================================="
echo ""
echo "✅ MENSAJES SIMPLIFICADOS:"
echo ""
echo "COMPROBANTE RECIBIDO:"
echo "- Código de pedido"
echo "- Mensaje de confirmación"
echo "- Tiempo de verificación"
echo "- Sin resumen detallado"
echo "- Sin emoticonos innecesarios"
echo ""
echo "OTROS MENSAJES:"
echo "- Menú sin emoticonos"
echo "- Estados de pedido limpios"
echo "- Notificaciones simplificadas"
echo "- Historial sin iconos"
echo ""
echo "Para ver los logs:"
echo "  heroku logs --tail -a cafe-bot-whatsapp-ad7ab21dc0a8"
