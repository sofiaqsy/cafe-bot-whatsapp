/**
 * Products Catalog Module
 * Manages all products available in the coffee shop
 * Ahora lee desde Google Sheets (hoja CatalogoWhatsApp)
 */

// Productos por defecto vacíos - se cargarán desde Google Sheets
const PRODUCTOS_DEFAULT = {};

class ProductCatalog {
    constructor() {
        this.products = PRODUCTOS_DEFAULT;
        this.lastUpdate = new Date();
        this.sheetsService = null;
        this.updateInterval = null;
    }
    
    /**
     * Inicializar con el servicio de Google Sheets
     */
    async initialize(sheetsService) {
        console.log('ProductCatalog.initialize() llamado');
        console.log(`   sheetsService recibido: ${sheetsService ? 'Sí' : 'No'}`);
        
        this.sheetsService = sheetsService;
        
        // Cargar catálogo inicial - ESPERAR a que termine
        console.log('   Cargando catálogo inicial...');
        await this.loadFromSheets();
        
        // Configurar actualización automática cada 5 minutos
        this.updateInterval = setInterval(() => {
            console.log('Actualización automática del catálogo...');
            this.loadFromSheets();
        }, 5 * 60 * 1000);
        
        console.log('ProductCatalog inicializado con Google Sheets');
        console.log(`   Productos cargados: ${Object.keys(this.products).length}`);
    }
    
    /**
     * Cargar productos desde Google Sheets
     */
    async loadFromSheets() {
        console.log('loadFromSheets() llamado');
        console.log(`   sheetsService disponible: ${this.sheetsService ? 'Sí' : 'No'}`);
        console.log(`   sheetsService inicializado: ${this.sheetsService?.initialized ? 'Sí' : 'No'}`);
        
        if (!this.sheetsService || !this.sheetsService.initialized) {
            console.log('Google Sheets no disponible, catálogo vacío');
            console.log(`   Productos actuales: ${Object.keys(this.products).length}`);
            return false;
        }
        
        try {
            console.log('Intentando obtener catálogo desde CatalogoWhatsApp...');
            
            const productosSheets = await this.sheetsService.obtenerCatalogo();
            
            console.log(`   Respuesta de obtenerCatalogo: ${productosSheets ? 'Datos recibidos' : 'null'}`);
            
            if (productosSheets && Object.keys(productosSheets).length > 0) {
                this.products = productosSheets;
                this.lastUpdate = new Date();
                console.log(`Catálogo actualizado: ${Object.keys(this.products).length} productos`);
                
                // Mostrar productos cargados
                Object.values(this.products).forEach(p => {
                    console.log(`   ${p.numero}. ${p.nombre} - S/${p.precio}`);
                });
                
                return true;
            } else {
                console.log('No se encontraron productos activos en Google Sheets');
                console.log('Catálogo vacío - Se mostrará mensaje de no disponibilidad');
                this.products = {}; // Vaciar productos para mostrar mensaje de no disponibilidad
                return false;
            }
        } catch (error) {
            console.error('Error cargando productos desde Sheets:', error.message);
            console.log(`   Catálogo actual tiene: ${Object.keys(this.products).length} productos`);
            return false;
        }
    }
    
    /**
     * Get all available products
     */
    getAllProducts() {
        return Object.values(this.products).filter(p => p.disponible);
    }
    
    /**
     * Get product by number/id
     */
    getProduct(identifier) {
        // Buscar por número o por ID
        return this.products[identifier] || 
               Object.values(this.products).find(p => p.id === identifier);
    }
    
    /**
     * Format product list for WhatsApp
     */
    formatProductList() {
        const products = this.getAllProducts();
        
        console.log(`formatProductList: ${products.length} productos disponibles`);
        
        if (products.length === 0) {
            return `CATÁLOGO DE CAFÉ\n\nNo hay productos disponibles en este momento.\n\nPor favor, intente más tarde o contacte al administrador.\n\n_Escriba *menu* para volver al menú principal_`;
        }
        
        let message = 'CATÁLOGO DE CAFÉ\n\n';
        
        products.forEach(product => {
            message += `*${product.numero}.* ${product.nombre}\n`;
            message += `   Origen: ${product.origen}\n`;
            message += `   ${product.descripcion}\n`;
            message += `   Precio: S/${product.precio}/kg\n`;
            
            // Mostrar stock si está disponible
            if (product.stock !== undefined && product.stock !== null) {
                if (product.stock > 0) {
                    message += `   Stock: ${product.stock}kg disponibles\n`;
                } else {
                    message += `   *Agotado temporalmente*\n`;
                }
            }
            
            message += '\n';
        });
        
        message += '*Pedido mínimo: 5kg*\n\n';
        message += '_Responde con el número del producto que deseas._';
        return message;
    }
    
    /**
     * Forzar recarga del catálogo desde Google Sheets
     */
    async forceReload() {
        console.log('🔄 Forzando recarga del catálogo...');
        const result = await this.loadFromSheets();
        if (result) {
            console.log('✅ Catálogo recargado exitosamente');
        } else {
            console.log('⚠️ No se pudo recargar el catálogo');
        }
        return result;
    }
    
    /**
     * Check if a product exists
     */
    productExists(identifier) {
        return !!this.getProduct(identifier);
    }
    
    /**
     * Get product price
     */
    getProductPrice(identifier) {
        const product = this.getProduct(identifier);
        return product ? product.precio : 0;
    }
    
    /**
     * Check product stock
     */
    hasStock(identifier, cantidad = 1) {
        const product = this.getProduct(identifier);
        if (!product) return false;
        
        // Si no hay información de stock, asumir que está disponible
        if (product.stock === undefined || product.stock === null) {
            return product.disponible;
        }
        
        // Verificar si hay suficiente stock
        return product.stock >= cantidad;
    }
    
    /**
     * Update product availability
     */
    setProductAvailability(identifier, available) {
        const product = this.getProduct(identifier);
        if (product) {
            product.disponible = available;
            return true;
        }
        return false;
    }
    
    /**
     * Reducir stock después de una venta
     */
    async reducirStock(identifier, cantidad) {
        const product = this.getProduct(identifier);
        if (!product) return false;
        
        // Si tenemos información de stock, actualizarla
        if (product.stock !== undefined && product.stock !== null) {
            const nuevoStock = Math.max(0, product.stock - cantidad);
            product.stock = nuevoStock;
            
            // Actualizar en Google Sheets si está disponible
            if (this.sheetsService && this.sheetsService.initialized) {
                try {
                    await this.sheetsService.actualizarStock(product.numero, nuevoStock);
                    console.log(`📦 Stock actualizado para ${product.nombre}: ${nuevoStock}kg`);
                } catch (error) {
                    console.error('Error actualizando stock en Sheets:', error);
                }
            }
            
            // Si el stock llega a 0, marcar como no disponible
            if (nuevoStock === 0) {
                product.disponible = false;
            }
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Obtener estadísticas del catálogo
     */
    getStats() {
        const products = Object.values(this.products);
        const available = products.filter(p => p.disponible);
        const outOfStock = products.filter(p => !p.disponible || (p.stock === 0));
        
        let totalStock = 0;
        products.forEach(p => {
            if (p.stock !== undefined && p.stock !== null) {
                totalStock += p.stock;
            }
        });
        
        return {
            totalProducts: products.length,
            availableProducts: available.length,
            outOfStock: outOfStock.length,
            totalStock: totalStock,
            lastUpdate: this.lastUpdate
        };
    }
    
    /**
     * Limpiar el intervalo de actualización
     */
    cleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

module.exports = new ProductCatalog();
