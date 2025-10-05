#!/bin/bash

# ========================================
# DEPLOY - VALIDACIÓN CONTRA GOOGLE SHEETS
# ========================================

echo "Desplegando validación de muestras duplicadas..."
echo ""

# Git add y commit con mensaje descriptivo
git add .
git commit -m "feat(validación): Verificar en Google Sheets si cliente ya recibió muestra

Funcionalidad agregada:
- Verificar en columna B (WhatsApp) de hoja Clientes
- Bloquear si el número ya existe en Sheets
- Mensaje personalizado cuando ya recibió muestra
- Método verificarClienteExiste() en sheets-service
- Comparación flexible de números (con/sin prefijos)

Flujo de validación:
1. Usuario envía SOLICITO MUESTRA
2. Bot busca número en Google Sheets
3. Si existe → Muestra mensaje de rechazo
4. Si no existe → Continúa con el registro

Previene duplicados y mantiene integridad de la campaña"

# Push a Heroku
echo "📤 Enviando a Heroku..."
git push heroku main

echo ""
echo "⏳ Esperando 30 segundos..."
sleep 30

echo ""
echo "=========================================="
echo "✅ VALIDACIÓN IMPLEMENTADA"
echo "=========================================="
echo ""
echo "FLUJO DE VALIDACIÓN:"
echo ""
echo "1. Usuario envía: SOLICITO MUESTRA"
echo "2. Bot verifica en Google Sheets (columna WhatsApp)"
echo "3. Si ya existe:"
echo "   → 'LO SENTIMOS"
echo "   → Ya has recibido tu muestra gratuita"
echo "   → Escribe MENU para pedido regular"
echo "4. Si NO existe:"
echo "   → Continúa con los 6 pasos"
echo ""
echo "DATOS VERIFICADOS:"
echo "- Columna B de hoja 'Clientes'"
echo "- Comparación de números sin prefijos"
echo "- Validación en tiempo real"
echo ""
echo "Para probar:"
echo "1. Intenta con un número que YA esté en tu Sheet"
echo "2. Intenta con un número NUEVO"
echo ""
