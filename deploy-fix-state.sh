#!/bin/bash

# ========================================
# FIX - CORREGIR MÉTODOS DE STATE-MANAGER
# ========================================

echo "🔧 Corrigiendo métodos de stateManager..."
echo ""

# Git add y commit
git add cafe-gratis-handler.js webhook-route.js
git commit -m "fix: Usar getUserState y setUserState en lugar de getState/setState"

# Push a Heroku
echo "🚀 Enviando fix a Heroku..."
git push heroku main

echo ""
echo "⏳ Esperando 20 segundos..."
sleep 20

echo ""
echo "✅ Error corregido!"
echo ""
echo "🔗 Ahora sí prueba el link:"
echo "https://wa.me/14155238886?text=SOLICITO%20MUESTRA"
echo ""
echo "Recuerda:"
echo "1. Primero envía: join accurate-single"
echo "2. Luego envía: SOLICITO MUESTRA"
echo ""
