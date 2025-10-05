#!/bin/bash

# ========================================
# DEPLOY CAFÉ GRATIS - CAMPAÑA DE CAPTACIÓN
# ========================================

echo "☕ Desplegando campaña de CAFÉ GRATIS..."
echo "========================================"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No estás en el directorio del proyecto"
    exit 1
fi

echo "📋 FUNCIONALIDAD AGREGADA:"
echo "  • Flujo de registro para café gratis"
echo "  • Validación de distritos permitidos"
echo "  • Verificación anti-duplicados"
echo "  • Registro automático en Google Sheets"
echo "  • Creación de pedido con total S/0"
echo ""

# Git add, commit y push
echo "📦 Preparando cambios para Heroku..."
git add cafe-gratis-handler.js webhook-route.js sheets-config-promo.js
git commit -m "feat: Agregar flujo de café gratis para campaña de captación"

echo ""
echo "🚀 Enviando a Heroku..."
git push heroku main

echo ""
echo "⏳ Esperando que se reinicie la aplicación (30 segundos)..."
sleep 30

echo ""
echo "=========================================="
echo "✅ DESPLIEGUE COMPLETADO"
echo "=========================================="
echo ""
echo "🔗 LINK DE WHATSAPP PARA LA CAMPAÑA:"
echo ""
echo "https://wa.me/51936934501?text=CAFEGRATUITO"
echo ""
echo "☝️ Este link llevará directo al flujo de registro"
echo ""
echo "📊 CONFIGURACIÓN EN GOOGLE SHEETS:"
echo ""
echo "1. Agrega una columna T en la pestaña 'Clientes':"
echo "   • Nombre: Estado_Cliente"
echo "   • Valores: Pendiente/Verificado/Rechazado/Prospecto"
echo ""
echo "2. Los pedidos gratuitos se crearán en 'PedidosWhatsApp':"
echo "   • Total: 0 (gratis)"
echo "   • Estado: Pendiente verificación"
echo "   • Comprobante: PROMOCIÓN - Café Gratis 1kg"
echo ""
echo "🎯 FLUJO DEL USUARIO:"
echo ""
echo "1. Click en link → 2. Registro 7 pasos → 3. Solicitud enviada"
echo ""
echo "📝 PASOS DEL REGISTRO:"
echo "  1. Nombre de cafetería"
echo "  2. Dirección"
echo "  3. Distrito (validación)"
echo "  4. Foto de fachada"
echo "  5. Nombre contacto"
echo "  6. RUC (opcional)"
echo "  7. Horario de entrega"
echo ""
echo "🔍 VALIDACIÓN:"
echo "  • Solo 1 café gratis por número WhatsApp"
echo "  • Solo distritos de Lima centro"
echo "  • Requiere foto de fachada"
echo ""
echo "📱 PARA PROBAR:"
echo "  1. Abre el link en tu celular"
echo "  2. Envía: CAFEGRATUITO"
echo "  3. Sigue los 7 pasos"
echo "  4. Verifica en Google Sheets"
echo ""
echo "✨ ¡Listo para captar nuevas cafeterías!"
echo ""
