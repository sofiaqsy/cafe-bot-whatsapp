#!/bin/bash
# Script de despliegue rápido para fix de compatibilidad WhatsApp

echo "========================================="
echo "DESPLEGANDO FIX DE COMPATIBILIDAD"
echo "========================================="
echo ""

# Ir al directorio del proyecto
cd "/Users/keylacusi/Desktop/OPEN IA/cafe-bots/cafe-bot-local"

# Agregar cambios
echo "📦 Agregando cambios..."
git add google-sheets.js migrar-whatsapp.js

# Crear commit
echo "💾 Creando commit..."
git commit -m "fix: Búsqueda compatible con ambos formatos de WhatsApp

- Modificado buscarCliente() para buscar con formato completo y número
- Agregado logs detallados para debugging
- Creado script de migración para actualizar registros antiguos
- Ahora funciona con registros antiguos (+51...) y nuevos (whatsapp:+51...)"

echo ""
echo "🚀 Haciendo push a GitHub..."
git push origin main

echo ""
echo "☁️ Desplegando a Heroku..."
git push heroku main

echo ""
echo "✅ Despliegue completado!"
echo ""
echo "Para migrar los datos antiguos, ejecuta localmente:"
echo "  node migrar-whatsapp.js"
echo ""
echo "Para ver los logs:"
echo "  heroku logs --tail -a cafe-bot-whatsapp-ad7ab21dc0a8"
