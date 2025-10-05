#!/bin/bash

# ========================================
# DEPLOY FINAL - 5 PASOS PARA CLIENTES
# ========================================

echo "Desplegando versión final con 5 pasos..."
echo ""

# Git add y commit
git add cafe-gratis-handler.js
git commit -m "refactor: Simplificar a 5 pasos y preparar datos para pestaña Clientes

- Reducir de 7 a 5 pasos (sin RUC ni horario)
- Preparar estructura de datos para pestaña Clientes
- Campo Estado_Cliente: Pendiente verificación
- Foto guardada en campo Notas
- Sin emojis ni referencias gratuitas"

# Push a Heroku
echo "Enviando a Heroku..."
git push heroku main

echo ""
echo "Esperando 20 segundos..."
sleep 20

echo ""
echo "=========================================="
echo "CONFIGURACIÓN FINAL"
echo "=========================================="
echo ""
echo "FLUJO DE 5 PASOS:"
echo "1. Nombre de cafetería"
echo "2. Dirección completa"
echo "3. Distrito (validación)"
echo "4. Foto de fachada"
echo "5. Nombre del contacto"
echo ""
echo "DATOS GUARDADOS (formato pestaña Clientes):"
echo "- ID_Cliente"
echo "- WhatsApp"
echo "- Empresa (nombre cafetería)"
echo "- Nombre Contacto"
echo "- Teléfono"
echo "- Dirección"
echo "- Distrito"
echo "- Ciudad: Lima"
echo "- Fecha Registro"
echo "- Total Pedidos: 1"
echo "- Total Kg: 1"
echo "- Notas: URL de foto"
echo "- Estado_Cliente: Pendiente verificación"
echo ""
echo "LINK FINAL:"
echo "https://wa.me/14155238886?text=SOLICITO%20MUESTRA"
echo ""
echo "NOTA: Los datos se guardan en memoria."
echo "Para persistencia en Google Sheets se necesita implementar sheets-service"
echo ""
