// Insere uma transformação de entrega do Cloudinary numa secure_url já
// existente (sem precisar de novo upload nem mudar o que fica armazenado).
// Ex.: .../image/upload/v123/pasta/foto.jpg -> .../image/upload/w_320/v123/pasta/foto.jpg
function transformar(url, transform) {
  if (!url || !url.includes('/upload/')) return url;
  return url.replace('/upload/', `/upload/${transform}/`);
}

// Miniatura da fila de validação (card 160×160 em CSS): pede já no tamanho
// certo em vez de baixar a foto inteira só para exibir pequena.
export function urlMiniatura(url) {
  return transformar(url, 'w_320,h_320,c_fill,q_auto,f_auto');
}

// Versão ampliada (lightbox): boa o suficiente pra conferência visual, sem
// carregar o arquivo bruto por padrão.
export function urlAmpliada(url) {
  return transformar(url, 'w_1200,q_auto,f_auto');
}
