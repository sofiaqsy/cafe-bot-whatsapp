#!/bin/bash

# ========================================
# DEPLOY FINAL - SOLICITO MUESTRA
# ========================================

echo "☕ Desplegando versión final con 'SOLICITO MUESTRA'..."
echo ""

# Git add y commit
git add cafe-gratis-handler.js webhook-route.js
git commit -m "feat: Cambiar trigger a SOLICITO MUESTRA - más claro y profesional"

# Push a Heroku
echo "🚀 Enviando a Heroku..."
git push heroku main

echo ""
echo "⏳ Esperando 20 segundos..."
sleep 20

echo ""
echo "=========================================="
echo "✅ CAMPAÑA LISTA PARA LANZAR"
echo "=========================================="
echo ""
echo "📱 LINK OFICIAL DE LA CAMPAÑA:"
echo ""
echo "https://wa.me/14155238886?text=SOLICITO%20MUESTRA"
echo ""
echo "=========================================="
echo ""
echo "📝 TEXTO PARA COMPARTIR EN REDES:"
echo ""
echo "☕ MUESTRA GRATIS DE CAFÉ PREMIUM"
echo ""
echo "Para cafeterías en Lima:"
echo "• 1kg de café orgánico premium"
echo "• Sin costo ni compromiso"
echo "• Entrega a domicilio"
echo ""
echo "Solicita tu muestra aquí:"
echo "https://wa.me/14155238886?text=SOLICITO%20MUESTRA"
echo ""
echo "*Primero envía: join accurate-single"
echo "*Luego envía el mensaje que aparece"
echo ""
echo "Promoción limitada a una muestra por cafetería."
echo "=========================================="
echo ""
echo "🎯 TRIGGERS ACTIVOS:"
echo "• SOLICITO MUESTRA (principal)"
echo "• SOLICITAR MUESTRA"
echo "• MUESTRA GRATIS"
echo "• PROMOCAFE"
echo "• PROMO1KG"
echo ""
echo "✨ ¡Éxito con tu campaña!"
echo ""
