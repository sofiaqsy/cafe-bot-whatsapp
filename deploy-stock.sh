#!/bin/bash
# Script de despliegue con actualización de stock

echo "========================================="
echo "DESPLIEGUE COMPLETO - ACTUALIZACIÓN DE STOCK"
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
git commit -m "feat: Actualización automática de stock en Google Sheets

NUEVAS FUNCIONALIDADES:
- Stock se actualiza automáticamente cuando se confirma un pedido
- Validación de stock antes de confirmar pedido
- Productos sin stock no aparecen en el catálogo
- Si stock llega a 0, el producto se marca como AGOTADO
- Muestra stock disponible en el catálogo
- Actualiza fecha de última modificación

MEJORAS ANTERIORES INCLUIDAS:
- Búsqueda de clientes compatible con ambos formatos
- Clientes existentes no repiten datos
- WhatsApp se guarda en formato completo
- Mensajes simplificados sin emoticonos innecesarios"

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
echo "✅ NUEVAS FUNCIONALIDADES IMPLEMENTADAS:"
echo ""
echo "1. CONTROL DE STOCK:"
echo "   - Se actualiza automáticamente al confirmar pedido"
echo "   - Valida disponibilidad antes de confirmar"
echo "   - Productos agotados no se muestran"
echo "   - Muestra stock disponible en catálogo"
echo ""
echo "2. GESTIÓN DE CLIENTES:"
echo "   - Reconoce clientes existentes"
echo "   - No pide datos repetidamente"
echo "   - Compatible con registros antiguos"
echo ""
echo "3. EXPERIENCIA MEJORADA:"
echo "   - Mensajes sin emoticonos innecesarios"
echo "   - Validación de stock en tiempo real"
echo "   - Actualización automática de estados"
echo ""
echo "Para probar el stock localmente:"
echo "  node test-stock.js"
echo ""
echo "Para ver los logs en tiempo real:"
echo "  heroku logs --tail -a cafe-bot-whatsapp-ad7ab21dc0a8"
