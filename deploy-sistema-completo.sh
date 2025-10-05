#!/bin/bash

# ========================================
# DEPLOY FINAL - SISTEMA COMPLETO MUESTRAS
# ========================================

echo "🚀 Desplegando sistema completo de muestras..."
echo ""

# Git add y commit
git add .
git commit -m "feat: Sistema completo de muestras con validación

Cambios implementados:
- Quitar mensaje de código de país (solo Perú)
- Agregar columna Estado en tabla Clientes
- Estados: Pendiente, Verificado, Rechazado, Prospecto
- Estado inicial: Pendiente (para validación)
- Integración con Google Drive para fotos
- Notificaciones automáticas a admins
- Validación contra duplicados en Sheets

Flujo de 6 pasos:
1. Nombre cafetería
2. Distrito
3. Dirección
4. Foto fachada
5. Nombre contacto
6. Teléfono (sin código país)

Columnas en Clientes (16):
A: ID_Cliente
B: WhatsApp
C: Empresa
D: Nombre_Contacto
E: Teléfono
F: Email
G: Dirección
H: Distrito
I: Ciudad
J: Fecha_Registro
K: Última_Compra
L: Total_Pedidos
M: Total_Comprado
N: Total_Kg
O: Notas
P: Estado_Cliente (NUEVO)"

# Push a Heroku
echo "📤 Enviando a Heroku..."
git push heroku main

echo ""
echo "⏳ Esperando 30 segundos..."
sleep 30

echo ""
echo "=========================================="
echo "✅ SISTEMA COMPLETO DESPLEGADO"
echo "=========================================="
echo ""
echo "CAMBIOS APLICADOS:"
echo "1. Sin código de país en teléfono"
echo "2. Nueva columna P: Estado_Cliente"
echo ""
echo "ESTADOS DISPONIBLES:"
echo "• Pendiente - Esperando validación (inicial)"
echo "• Verificado - Cliente validado y activo"
echo "• Rechazado - No cumple requisitos"
echo "• Prospecto - Registro inicial sin validar"
echo ""
echo "FLUJO DE VALIDACIÓN:"
echo "1. Cliente completa 6 pasos"
echo "2. Se guarda con Estado: Pendiente"
echo "3. Admin recibe notificación"
echo "4. Admin revisa foto en Drive"
echo "5. Admin actualiza Estado en Sheets"
echo ""
echo "IMPORTANTE:"
echo "Asegúrate de agregar la columna P (Estado_Cliente)"
echo "en tu Google Sheet si no existe"
echo ""
echo "Para probar:"
echo "https://wa.me/14155238886?text=SOLICITO%20MUESTRA"
echo ""
