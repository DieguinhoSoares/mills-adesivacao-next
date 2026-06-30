// Upload de evidência fotográfica via Cloudinary, no mesmo padrão usado
// no mills-doc-portal. Evita depender do Firebase Storage (que hoje exige
// plano pago, Blaze, mesmo para uso baixo).
//
// Pré-requisito: criar um "Upload preset" do tipo "Unsigned" no painel do
// Cloudinary (Settings > Upload > Upload presets > Add upload preset).
// Isso permite subir arquivo direto do navegador sem expor API secret.

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export async function uploadEvidencia(file, { frotaId }) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', `mills-adesivacao-next/${frotaId}`);

  const res = await fetch(url, { method: 'POST', body: formData });
  if (!res.ok) {
    throw new Error('Falha ao enviar a foto. Tente novamente.');
  }
  const data = await res.json();
  return data.secure_url;
}
