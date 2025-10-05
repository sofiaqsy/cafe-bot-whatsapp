#!/bin/bash

# ========================================
# HOTFIX - ERROR MODULE NOT FOUND
# ========================================

echo "🔧 Aplicando hotfix para error de módulo..."
echo ""

# Git add y commit
git add cafe-gratis-handler.js
git commit -m "fix: Corregir importación de google-drive-service

Error: Cannot find module './drive-service'
Causa: Nombre incorrecto del módulo

Solución:
- Importar correctamente google-drive-service al inicio
- No re-importar dentro de métodos
- Usar la variable ya importada

El archivo correcto es google-drive-service.js"

# Push a Heroku
echo "📤 Enviando hotfix a Heroku..."
git push heroku main

echo ""
echo "⏳ Esperando 30 segundos..."
sleep 30

echo ""
echo "✅ HOTFIX APLICADO"
echo ""
echo "Verificando estado del dyno..."
heroku ps -a cafe-bot-whatsapp

echo ""
echo "Para ver logs:"
echo "heroku logs --tail -a cafe-bot-whatsapp"
echo ""
