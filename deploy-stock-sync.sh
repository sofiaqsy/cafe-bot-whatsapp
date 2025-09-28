#!/bin/bash
# Script de despliegue - Sincronización de stock en memoria

echo "========================================="
echo "DESPLIEGUE - SINCRONIZACIÓN DE STOCK"
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
git commit -m "fix: Sincronización de stock en memoria después de actualización

PROBLEMA RESUELTO:
- El stock se quedaba en memoria con valor anterior
- Ahora el catálogo se recarga automáticamente después de actualizar stock

MEJORAS IMPLEMENTADAS:
- Recarga automática del catálogo al actualizar stock
- Método forceReload() para forzar actualización
- Catálogo se recarga antes de mostrarse al cliente
- Sincronización inmediata entre Google Sheets y memoria

FUNCIONALIDADES COMPLETAS:
- Stock se actualiza automáticamente al confirmar pedido
- Validación de stock antes de confirmar
- Productos sin stock no aparecen en catálogo
- Si stock llega a 0, producto se marca como AGOTADO
- Catálogo siempre muestra datos actualizados
- Sincronización en tiempo real"

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
echo "✅ PROBLEMA RESUELTO:"
echo "   El stock ahora se sincroniza correctamente entre"
echo "   Google Sheets y la memoria del bot"
echo ""
echo "📋 FLUJO ACTUALIZADO:"
echo "1. Cliente hace pedido"
echo "2. Se actualiza stock en Google Sheets"
echo "3. Se recarga automáticamente el catálogo en memoria"
echo "4. Próximo cliente ve el stock actualizado"
echo ""
echo "🧪 PARA PROBAR LOCALMENTE:"
echo "   node test-stock-sync.js"
echo ""
echo "📊 PARA VER LOGS:"
echo "   heroku logs --tail -a cafe-bot-whatsapp-ad7ab21dc0a8"
