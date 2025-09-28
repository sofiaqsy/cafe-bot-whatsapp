#!/bin/bash
# Script para desplegar los cambios actuales

echo "========================================="
echo "DESPLIEGUE FINAL - MENSAJES SIMPLIFICADOS"
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
git commit -m "fix: Simplificar mensajes y mejorar compatibilidad

- Búsqueda de clientes compatible con ambos formatos
- Eliminados emoticonos decorativos en algunos mensajes
- Mensaje de comprobante mantenido funcional
- WhatsApp se guarda en formato completo
- Clientes existentes no repiten datos"

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
echo "CAMBIOS IMPLEMENTADOS:"
echo ""
echo "1. BÚSQUEDA DE CLIENTES:"
echo "   - Compatible con formato antiguo (+51...) y nuevo (whatsapp:+51...)"
echo "   - Los clientes existentes son reconocidos automáticamente"
echo ""
echo "2. MENSAJES SIMPLIFICADOS:"
echo "   - Menú de información sin emoticonos"
echo "   - Consultar pedido sin lupa"
echo "   - Recordatorio de comprobante simplificado"
echo ""
echo "3. FUNCIONALIDADES MEJORADAS:"
echo "   - WhatsApp se guarda en formato completo"
echo "   - Clientes no repiten datos en cada pedido"
echo "   - Mensaje de comprobante recibido funcional"
echo ""
echo "Para ver los logs en tiempo real:"
echo "  heroku logs --tail -a cafe-bot-whatsapp-ad7ab21dc0a8"
