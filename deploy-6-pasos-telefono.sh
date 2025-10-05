#!/bin/bash

# ========================================
# DEPLOY - FLUJO COMPLETO 6 PASOS CON TELÉFONO
# ========================================

echo "Desplegando flujo completo de 6 pasos con teléfono..."
echo ""

# Git add y commit con mensaje descriptivo
git add .
git commit -m "feat(flujo): Agregar paso de teléfono y mejorar formato WhatsApp

Cambios principales:
- Agregar paso 6: Solicitar teléfono del contacto
- WhatsApp: Guardar solo número sin prefijo 'whatsapp:'
- Teléfono: Usar el ingresado por el usuario, no el de WhatsApp
- Actualizar todos los pasos a 'DE 6' en mensajes
- Validación de teléfono mínimo 8 dígitos
- Mostrar teléfono en resumen final

Mejoras en datos guardados:
- Columna WhatsApp: Solo número (51936934501)
- Columna Teléfono: Número ingresado por usuario
- Datos más limpios para Google Sheets"

# Push a Heroku
echo "📤 Enviando a Heroku..."
git push heroku main

echo ""
echo "⏳ Esperando 30 segundos..."
sleep 30

echo ""
echo "=========================================="
echo "✅ FLUJO COMPLETO DE 6 PASOS DESPLEGADO"
echo "=========================================="
echo ""
echo "FLUJO ACTUALIZADO:"
echo "1. Nombre de cafetería"
echo "2. Distrito (selección)"
echo "3. Dirección completa"
echo "4. Foto de fachada"
echo "5. Nombre del contacto"
echo "6. TELÉFONO del contacto ← NUEVO"
echo ""
echo "FORMATO DE DATOS:"
echo "- WhatsApp: Solo número (ej: 51936934501)"
echo "- Teléfono: Número ingresado por el usuario"
echo "- Sin prefijos 'whatsapp:' ni '+'"
echo ""
echo "LINK DE PRUEBA:"
echo "https://wa.me/14155238886?text=SOLICITO%20MUESTRA"
echo ""
echo "Los datos ahora aparecerán limpios en tu Google Sheet"
echo ""
