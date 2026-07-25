import { createContext, useContext } from 'react';
import { useUnidades } from '../hooks/useUnidades';

// Mesma ideia do FrotasContext: um único fetch de `unidades` compartilhado
// pela área interna, em vez de cada tela buscar a coleção inteira de novo.
const UnidadesContext = createContext(null);

export function UnidadesProvider({ children }) {
  const value = useUnidades();
  return <UnidadesContext.Provider value={value}>{children}</UnidadesContext.Provider>;
}

export function useUnidadesContext() {
  const ctx = useContext(UnidadesContext);
  if (!ctx) throw new Error('useUnidadesContext deve ser usado dentro de <UnidadesProvider>.');
  return ctx;
}
