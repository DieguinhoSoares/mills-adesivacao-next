// Upload de evidência fotográfica via Cloudinary, no mesmo padrão usado
// no mills-doc-portal. Evita depender do Firebase Storage (que hoje exige
// plano pago, Blaze, mesmo para uso baixo).
//
// Pré-requisito: criar um "Upload preset" do tipo "Unsigned" no painel do
// Cloudinary (Settings > Upload > Upload presets > Add upload preset).
// Isso permite subir arquivo direto do navegador sem expor API secret.

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const MAX_DIMENSAO = 1600; // px no lado maior — suficiente para o analista conferir a foto
const QUALIDADE_JPEG = 0.82;

// Fotos de celular (principalmente as mais recentes) costumam vir com 8-15MB,
// acima do limite de upload do preset do Cloudinary. Reduz resolução/qualidade
// antes de enviar, o que também ajuda em conexão ruim no campo.
function comprimirImagem(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const escala = Math.min(1, MAX_DIMENSAO / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * escala);
      canvas.height = Math.round(img.height * escala);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Falha ao processar a imagem.'))),
        'image/jpeg',
        QUALIDADE_JPEG
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Falha ao ler a imagem.'));
    };
    img.src = url;
  });
}

export async function uploadEvidencia(file, { frotaId }) {
  const arquivo = file.type.startsWith('image/') ? await comprimirImagem(file) : file;

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  const formData = new FormData();
  formData.append('file', arquivo, 'evidencia.jpg');
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', `mills-adesivacao-next/${frotaId}`);

  const res = await fetch(url, { method: 'POST', body: formData });
  if (!res.ok) {
    const detalhe = await res.json().catch(() => null);
    console.error('Cloudinary upload falhou:', detalhe);
    throw new Error(detalhe?.error?.message || 'Falha ao enviar a foto. Tente novamente.');
  }
  const data = await res.json();
  return data.secure_url;
}
