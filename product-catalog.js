/**
 * Products Catalog Module
 * Manages all products available in the coffee shop
 */

// Static products catalog (can be replaced with dynamic loading from Sheets)
const PRODUCTOS = {
    '1': {
        id: 'premium',
        numero: '1',
        nombre: 'Café Arábica Premium',
        precio: 50,
        origen: 'Chanchamayo, Junín',
        descripcion: 'Notas de chocolate y frutos rojos',
        disponible: true
    },
    '2': {
        id: 'estandar',
        numero: '2',
        nombre: 'Café Arábica Estándar',
        precio: 40,
        origen: 'Satipo, Junín',
        descripcion: 'Notas de caramelo y nueces',
        disponible: true
    },
    '3': {
        id: 'organico',
        numero: '3',
        nombre: 'Café Orgánico Certificado',
        precio: 60,
        origen: 'Villa Rica, Pasco',
        descripcion: 'Notas florales y cítricas',
        disponible: true
    },
    '4': {
        id: 'mezcla',
        numero: '4',
        nombre: 'Mezcla Especial Cafeterías',
        precio: 35,
        origen: 'Blend peruano',
        descripcion: 'Equilibrado, ideal para espresso',
        disponible: true
    },
    '5': {
        id: 'descafeinado',
        numero: '5',
        nombre: 'Café Descafeinado Suave',
        precio: 45,
        origen: 'Cusco',
        descripcion: 'Suave y aromático, sin cafeína',
        disponible: true
    }
};

class ProductCatalog {
    constructor() {
        this.products = PRODUCTOS;
        this.lastUpdate = new Date();
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
        return this.products[identifier] || 
               Object.values(this.products).find(p => p.id === identifier);
    }
    
    /**
     * Format product list for WhatsApp
     */
    formatProductList() {
        const products = this.getAllProducts();
        let message = '☕ *CATÁLOGO DE CAFÉ* ☕\n\n';
        
        products.forEach(product => {
            message += `*${product.numero}.* ${product.nombre}\n`;
            message += `   📍 Origen: ${product.origen}\n`;
            message += `   🎯 ${product.descripcion}\n`;
            message += `   💰 Precio: S/${product.precio}/kg\n\n`;
        });
        
        message += '_Responde con el número del producto que deseas._';
        return message;
    }
    
    /**
     * Load products from Google Sheets
     */
    async loadFromSheets(sheetsService) {
        try {
            // This can be implemented to load products dynamically
            console.log('📦 Cargando productos desde Sheets...');
            // const products = await sheetsService.getProducts();
            // this.products = products;
            return true;
        } catch (error) {
            console.error('Error loading products:', error);
            return false;
        }
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
}

module.exports = new ProductCatalog();
