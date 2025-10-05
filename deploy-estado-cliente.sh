#!/bin/bash

# ========================================
# DEPLOY FINAL - AJUSTES Y COLUMNA ESTADO
# ========================================

echo "🚀 Desplegando ajustes finales y columna de estado..."
echo ""

# Git add y commit
git add .
git commit -m "feat: Simplificar teléfono y agregar columna Estado_Cliente

Cambios implementados:
1. TELÉFONO SIMPLIFICADO:
   - Quitar instrucción de código de país
   - Solo pedir número (es solo Perú)
   - Mensaje más simple y directo

2. NUEVA COLUMNA EN SHEETS:
   - Columna P: Estado_Cliente
   - Valor inicial: 'Pendiente verificación'
   - Permite tracking del proceso de validación
   - Admin puede cambiar a: Aprobado, Rechazado, En proceso

3. ESTRUCTURA FINAL CLIENTES (16 columnas):
   A: ID_Cliente
   B: WhatsApp
   C: Empresa/Negocio
   D: Nombre Contacto
   E: Teléfono Contacto
   F: Email
   G: Dirección
   H: Distrito
   I: Ciudad
   J: Fecha Registro
   K: Última Compra
   L: Total Pedidos
   M: Total Comprado
   N: Total Kg
   O: Notas (con URL foto)
   P: Estado_Cliente ← NUEVA

Flujo mejorado para validación de muestras"

# Push a Heroku
echo "📤 Enviando a Heroku..."
git push heroku main

echo ""
echo "⏳ Esperando 30 segundos..."
sleep 30

echo ""
echo "=========================================="
echo "✅ SISTEMA COMPLETAMENTE ACTUALIZADO"
echo "=========================================="
echo ""
echo "CAMBIOS APLICADOS:"
echo ""
echo "1. MENSAJE DE TELÉFONO:"
echo "   Antes: '¿Cuál es tu número? (incluye código de país)'"
echo "   Ahora: '¿Cuál es tu número de teléfono?'"
echo ""
echo "2. NUEVA COLUMNA EN GOOGLE SHEETS:"
echo "   Columna P: Estado_Cliente"
echo "   Valores posibles:"
echo "   - Pendiente verificación (inicial)"
echo "   - Aprobado"
echo "   - Rechazado"
echo "   - En proceso"
echo ""
echo "IMPORTANTE:"
echo "📊 Agregar encabezado 'Estado_Cliente' en columna P de tu Google Sheet"
echo ""
echo "FLUJO DE VALIDACIÓN:"
echo "1. Cliente completa registro → Estado: 'Pendiente verificación'"
echo "2. Admin revisa foto y datos"
echo "3. Admin actualiza estado en Sheets"
echo "4. Sistema puede filtrar por estado"
echo ""
echo "Para probar:"
echo "1. Envía SOLICITO MUESTRA"
echo "2. Completa los 6 pasos"
echo "3. Verifica que aparezca en columna P: 'Pendiente verificación'"
echo ""
