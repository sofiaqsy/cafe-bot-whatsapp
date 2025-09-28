"""
Módulo para gestionar el catálogo de productos en WhatsApp
"""

import logging
from datetime import datetime
import pytz

logger = logging.getLogger(__name__)
peru_tz = pytz.timezone('America/Lima')

class CatalogoManager:
    def __init__(self, sheets_service):
        self.sheets = sheets_service
        self.CATALOGO_RANGE = 'CatalogoWhatsApp!A:J'
        
    def obtener_catalogo(self):
        """Obtiene todos los productos del catálogo"""
        try:
            result = self.sheets.values().get(
                spreadsheetId=self.sheets.spreadsheet_id,
                range=self.CATALOGO_RANGE
            ).execute()
            
            values = result.get('values', [])
            if len(values) <= 1:
                return []
            
            productos = []
            headers = values[0]
            
            for row in values[1:]:
                if len(row) > 0 and row[0]:  # Si tiene ID
                    producto = {}
                    for i, header in enumerate(headers[:len(row)]):
                        producto[header] = row[i] if i < len(row) else ''
                    
                    # Solo incluir productos activos con stock
                    if producto.get('Estado', '').upper() == 'ACTIVO':
                        try:
                            stock = float(producto.get('Stock_Kg', '0'))
                            if stock > 0:
                                productos.append(producto)
                        except:
                            pass
                            
            return productos
            
        except Exception as e:
            logger.error(f"Error obteniendo catálogo: {e}")
            return []
    
    def formatear_catalogo(self, productos):
        """Formatea el catálogo para enviar por WhatsApp"""
        if not productos:
            return "📭 *No hay productos disponibles en este momento*"
        
        mensaje = "☕ *CATÁLOGO DE CAFÉ DISPONIBLE*\n"
        mensaje += "━━━━━━━━━━━━━━━━━━━━━\n\n"
        
        for p in productos:
            try:
                nombre = p.get('Nombre', 'Sin nombre')
                precio = p.get('Precio_Kg', '0')
                stock = p.get('Stock_Kg', '0')
                origen = p.get('Origen', 'No especificado')
                puntaje = p.get('Puntaje', '-')
                agricultor = p.get('Agricultor', 'No especificado')
                
                mensaje += f"*{nombre}*\n"
                mensaje += f"💰 S/{precio} por kg\n"
                mensaje += f"📦 Disponible: {stock} kg\n"
                mensaje += f"📍 Origen: {origen}\n"
                mensaje += f"⭐ Puntaje: {puntaje}/100\n"
                mensaje += f"👨‍🌾 Agricultor: {agricultor}\n"
                mensaje += "────────────────\n\n"
                
            except Exception as e:
                logger.error(f"Error formateando producto: {e}")
                continue
        
        mensaje += "_Para ordenar, envía un mensaje con el nombre del café y la cantidad deseada_"
        
        return mensaje
    
    def buscar_producto(self, nombre_busqueda):
        """Busca un producto específico por nombre"""
        productos = self.obtener_catalogo()
        
        for producto in productos:
            if nombre_busqueda.lower() in producto.get('Nombre', '').lower():
                return producto
        
        return None
    
    def actualizar_stock(self, producto_id, nuevo_stock):
        """Actualiza el stock de un producto después de una venta"""
        try:
            # Obtener todos los productos
            result = self.sheets.values().get(
                spreadsheetId=self.sheets.spreadsheet_id,
                range=self.CATALOGO_RANGE
            ).execute()
            
            values = result.get('values', [])
            
            # Buscar la fila del producto
            for i, row in enumerate(values[1:], start=2):
                if len(row) > 0 and row[0] == producto_id:
                    # Actualizar stock (columna G)
                    range_update = f'CatalogoWhatsApp!G{i}'
                    body = {'values': [[str(nuevo_stock)]]}
                    
                    self.sheets.values().update(
                        spreadsheetId=self.sheets.spreadsheet_id,
                        range=range_update,
                        valueInputOption='USER_ENTERED',
                        body=body
                    ).execute()
                    
                    # Actualizar fecha de última modificación (columna J)
                    ahora = datetime.now(peru_tz)
                    fecha_mod = ahora.strftime("%d/%m/%Y %H:%M")
                    
                    range_fecha = f'CatalogoWhatsApp!J{i}'
                    body_fecha = {'values': [[fecha_mod]]}
                    
                    self.sheets.values().update(
                        spreadsheetId=self.sheets.spreadsheet_id,
                        range=range_fecha,
                        valueInputOption='USER_ENTERED',
                        body=body_fecha
                    ).execute()
                    
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error actualizando stock: {e}")
            return False

# Estructura de la hoja CatalogoWhatsApp en Google Sheets:
"""
COLUMNAS:
A: ID_Producto (CAT-001, CAT-002, etc.)
B: Nombre (Café Orgánico Premium, etc.)
C: Precio_Kg (precio por kilogramo)
D: Origen (Cusco, Puno, etc.)
E: Puntaje (85, 90, etc. - sobre 100)
F: Agricultor (nombre del productor)
G: Stock_Kg (cantidad disponible)
H: Descripcion (notas de cata, características)
I: Estado (ACTIVO/INACTIVO)
J: Ultima_Modificacion (fecha/hora)
"""