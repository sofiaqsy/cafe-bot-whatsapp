#!/bin/bash

# ========================================
# FIX - LEER SOLO DE GOOGLE SHEETS
# ========================================

echo "🔧 Corrigiendo para que SOLO lea de Google Sheets..."
echo ""

# Git add y commit
git add .
git commit -m "fix: Usar Google Sheets como única fuente de verdad para validación

PROBLEMA: Bot verificaba en memoria además de Sheets
SOLUCIÓN: Solo verificar en Google Sheets

Cambios:
- Eliminar verificación en memoria local (stateManager)
- Solo usar sheetsService.verificarClienteExiste()
- Limpiar estado en memoria al iniciar solicitud
- Agregar logs de debug para ver qué está leyendo
- Comparación exacta de números (sin includes)

Debug mejorado:
- Muestra total de filas leídas
- Muestra primeras 5 filas para debug
- Indica si encuentra o no el cliente
- Logs claros de cada paso

Comportamiento:
- Si el número NO está en Sheets → Permite registro
- Si el número SÍ está en Sheets → Bloquea registro
- Si hay error con Sheets → Permite continuar"

# Push a Heroku
echo "📤 Enviando fix a Heroku..."
git push heroku main

echo ""
echo "⏳ Esperando 30 segundos..."
sleep 30

echo ""
echo "=========================================="
echo "✅ FIX APLICADO - SOLO LEE DE SHEETS"
echo "=========================================="
echo ""
echo "VERIFICACIÓN:"
echo "1. Borra el registro del Excel/Google Sheets"
echo "2. Espera unos segundos"
echo "3. Intenta con SOLICITO MUESTRA"
echo ""
echo "EN LOS LOGS VERÁS:"
echo "🔍 Verificando si existe cliente: [número]"
echo "📄 Total de filas en Clientes: X"
echo "ℹ️ Cliente NO encontrado en Sheets"
echo "✅ Cliente puede continuar"
echo ""
echo "Para ver logs en tiempo real:"
echo "heroku logs --tail -a cafe-bot-whatsapp"
echo ""
echo "Si aún no funciona, verifica que:"
echo "- El registro esté completamente borrado del Sheet"
echo "- No haya espacios o caracteres extra en la columna B"
echo "- El Sheet se haya guardado/sincronizado"
echo ""
