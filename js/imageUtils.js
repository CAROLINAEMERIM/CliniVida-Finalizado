// Utilitários para manipulação de imagens
// Funções reutilizáveis para tratamento de buffers e conversão de imagens

/**
 * Converte buffer da API em URL de imagem
 * @param {Object} bufferData - Dados do buffer da API
 * @returns {string|null} - URL da imagem ou null se erro
 */
function bufferToImageUrl(bufferData) {
  try {
    if (!bufferData || !bufferData.data || !Array.isArray(bufferData.data)) {
      return null;
    }
    
    // Converter array de bytes em Uint8Array
    const uint8Array = new Uint8Array(bufferData.data);
    
    // Detectar tipo de imagem pelos primeiros bytes (magic numbers)
    let mimeType = 'image/jpeg'; // padrão
    
    if (uint8Array.length >= 4) {
      // PNG: 89 50 4E 47
      if (uint8Array[0] === 0x89 && uint8Array[1] === 0x50 && 
          uint8Array[2] === 0x4E && uint8Array[3] === 0x47) {
        mimeType = 'image/png';
      }
      // JPEG: FF D8 FF
      else if (uint8Array[0] === 0xFF && uint8Array[1] === 0xD8 && uint8Array[2] === 0xFF) {
        mimeType = 'image/jpeg';
      }
      // WebP: começa com "RIFF" e contém "WEBP"
      else if (uint8Array.length >= 12 && 
               uint8Array[0] === 0x52 && uint8Array[1] === 0x49 && 
               uint8Array[2] === 0x46 && uint8Array[3] === 0x46 &&
               uint8Array[8] === 0x57 && uint8Array[9] === 0x45 && 
               uint8Array[10] === 0x42 && uint8Array[11] === 0x50) {
        mimeType = 'image/webp';
      }
      // GIF: 47 49 46 38
      else if (uint8Array[0] === 0x47 && uint8Array[1] === 0x49 && 
               uint8Array[2] === 0x46 && uint8Array[3] === 0x38) {
        mimeType = 'image/gif';
      }
    }
    
    // Criar blob da imagem com o tipo correto
    const blob = new Blob([uint8Array], { type: mimeType });
    
    // Criar URL object para a imagem
    const imageUrl = URL.createObjectURL(blob);
    
    console.log(`Imagem carregada como ${mimeType}, tamanho: ${uint8Array.length} bytes`);
    
    return imageUrl;
  } catch (error) {
    console.error('Erro ao converter buffer para imagem:', error);
    return null;
  }
}

/**
 * Gerenciador de URLs de blob para evitar vazamentos de memória
 */
class ImageUrlManager {
  constructor() {
    this.urls = [];
  }
  
  /**
   * Adiciona uma URL para ser gerenciada
   * @param {string} url - URL da imagem
   */
  addUrl(url) {
    if (url && url.startsWith('blob:')) {
      this.urls.push(url);
    }
  }
  
  /**
   * Limpa todas as URLs armazenadas
   */
  clear() {
    this.urls.forEach(url => {
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    this.urls = [];
  }
  
  /**
   * Remove uma URL específica
   * @param {string} url - URL para remover
   */
  removeUrl(url) {
    const index = this.urls.indexOf(url);
    if (index > -1) {
      URL.revokeObjectURL(url);
      this.urls.splice(index, 1);
    }
  }
}

/**
 * Detecta o tipo MIME de uma imagem pelos magic numbers
 * @param {Uint8Array} uint8Array - Array de bytes da imagem
 * @returns {string} - Tipo MIME detectado
 */
function detectImageMimeType(uint8Array) {
  if (!uint8Array || uint8Array.length < 4) {
    return 'image/jpeg'; // padrão
  }
  
  // PNG: 89 50 4E 47
  if (uint8Array[0] === 0x89 && uint8Array[1] === 0x50 && 
      uint8Array[2] === 0x4E && uint8Array[3] === 0x47) {
    return 'image/png';
  }
  
  // JPEG: FF D8 FF
  if (uint8Array[0] === 0xFF && uint8Array[1] === 0xD8 && uint8Array[2] === 0xFF) {
    return 'image/jpeg';
  }
  
  // WebP: começa com "RIFF" e contém "WEBP"
  if (uint8Array.length >= 12 && 
      uint8Array[0] === 0x52 && uint8Array[1] === 0x49 && 
      uint8Array[2] === 0x46 && uint8Array[3] === 0x46 &&
      uint8Array[8] === 0x57 && uint8Array[9] === 0x45 && 
      uint8Array[10] === 0x42 && uint8Array[11] === 0x50) {
    return 'image/webp';
  }
  
  // GIF: 47 49 46 38
  if (uint8Array[0] === 0x47 && uint8Array[1] === 0x49 && 
      uint8Array[2] === 0x46 && uint8Array[3] === 0x38) {
    return 'image/gif';
  }
  
  // BMP: 42 4D
  if (uint8Array[0] === 0x42 && uint8Array[1] === 0x4D) {
    return 'image/bmp';
  }
  
  return 'image/jpeg'; // padrão se não detectar
}

/**
 * Converte base64 para blob URL
 * @param {string} base64Data - Dados em base64
 * @param {string} mimeType - Tipo MIME da imagem
 * @returns {string|null} - URL da imagem ou null se erro
 */
function base64ToImageUrl(base64Data, mimeType = 'image/jpeg') {
  try {
    // Remove prefixo data: se presente
    const base64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // Converte base64 para array de bytes
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    
    // Criar blob
    const blob = new Blob([byteArray], { type: mimeType });
    
    // Criar URL
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Erro ao converter base64 para imagem:', error);
    return null;
  }
}

// Exportar funções para uso global
if (typeof window !== 'undefined') {
  window.bufferToImageUrl = bufferToImageUrl;
  window.ImageUrlManager = ImageUrlManager;
  window.detectImageMimeType = detectImageMimeType;
  window.base64ToImageUrl = base64ToImageUrl;
}

// Para uso com módulos (caso necessário no futuro)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    bufferToImageUrl,
    ImageUrlManager,
    detectImageMimeType,
    base64ToImageUrl
  };
}
