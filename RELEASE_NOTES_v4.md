# RELEASE NOTES v4.0.0

## 🆕 Nuevas Funcionalidades

### 1. Sistema de Pedidos Pendientes
- Los clientes ven sus pedidos pendientes de verificación al iniciar conversación
- Información clara del tiempo transcurrido desde el pedido
- Fácil consulta del estado con el código

### 2. Función "Volver a Pedir" (Reorden)
- Nueva opción 4 en el menú principal
- Muestra los últimos 5 pedidos del cliente
- Proceso simplificado: va directo al pago sin pedir datos nuevamente

### 3. Memoria de Datos del Cliente
- El bot recuerda los datos del cliente (empresa, contacto, teléfono, dirección)
- Segunda compra y posteriores: no se vuelven a solicitar datos
- Ahorro de tiempo significativo para clientes frecuentes

### 4. Verificación de Pagos en 2 Pasos
- Paso 1: Muestra datos bancarios para transferencia
- Paso 2: Solicita comprobante de pago
- Estado "Pendiente verificación" hasta confirmar el pago
- Mayor seguridad y control de pagos

### 5. Panel Administrativo Mejorado
- Contador de clientes registrados
- Contador de pedidos pendientes de verificación
- Diferenciación visual entre pedidos NUEVOS y REORDENES
- Indicador de comprobante recibido

## 🔧 Mejoras Técnicas

- Optimización del flujo de pedidos
- Mejor manejo de estados
- Reducción de pasos para clientes recurrentes
- Integración mejorada con Google Sheets
- Logs detallados en modo desarrollo

## 📊 Datos Bancarios Configurados

- BCP Soles: 1917137473085
- CCI: 00219100713747308552

## ⚠️ Cambios Importantes

- Archivo principal cambiado de `bot.js` a `bot-final.js`
- Eliminación de métodos de pago Yape/Plin y Efectivo
- Solo transferencia bancaria disponible
- Iconos menos alarmantes (sin ⚠️)

## 🚀 Comandos Disponibles

- `hola` - Iniciar conversación
- `menu` - Ver menú principal
- `cancelar` - Cancelar pedido actual
- `1`, `2`, `3`, `4` - Acceso directo a opciones

## 📝 Notas de Implementación

- Requiere configuración de variables de entorno en Heroku
- Google Sheets opcional pero recomendado
- Modo desarrollo disponible con DEV_MODE=true
