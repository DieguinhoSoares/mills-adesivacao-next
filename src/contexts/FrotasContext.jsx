import { createContext, useContext } from 'react';
import { useFrotas } from '../hooks/useFrotas';

// Um único listener em tempo real (onSnapshot) compartilhado por toda a área
// interna, em vez de cada tela (e a sidebar) abrirem o próprio listener e
// duplicarem a leitura da coleção inteira a cada navegação/atualização.
const FrotasContext = createContext(null);

export function FrotasProvider({ children }) {
  const value = useFrotas();
  return <FrotasContext.Provider value={value}>{children}</FrotasContext.Provider>;
}

export function useFrotasContext() {
  const ctx = useContext(FrotasContext);
  if (!ctx) throw new Error('useFrotasContext deve ser usado dentro de <FrotasProvider>.');
  return ctx;
}
