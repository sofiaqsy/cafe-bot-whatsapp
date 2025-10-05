#!/bin/bash

# ========================================
# HOTFIX - ERROR CONFIG.GOOGLE.SPREADSHEETID
# ========================================

echo "🔧 Aplicando hotfix para error de config..."
echo ""

# Git add y commit con mensaje descriptivo
git add sheets-service.js
git commit -m "fix(sheets): Corregir error 'Cannot read properties of undefined'

- Remover referencia a config.google.spreadsheetId en constructor
- Asignar spreadsheetId en método initialize() en lugar del constructor
- Eliminar import innecesario de config.js
- Prevenir crash al iniciar la aplicación

El spreadsheetId ahora se obtiene correctamente de process.env.GOOGLE_SPREADSHEET_ID"

# Push a Heroku
echo "📤 Enviando hotfix a Heroku..."
git push heroku main

echo ""
echo "⏳ Esperando 30 segundos para que reinicie..."
sleep 30

echo ""
echo "✅ HOTFIX APLICADO"
echo ""
echo "Verificando estado del dyno..."
heroku ps -a cafe-bot-whatsapp

echo ""
echo "Para ver logs en tiempo real:"
echo "heroku logs --tail -a cafe-bot-whatsapp"
echo ""
echo "El bot debería estar funcionando ahora sin errores."
echo ""
