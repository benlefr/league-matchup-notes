export function getRuneImagePath(filename) {
  // En développement avec Vite
  if (import.meta.env.DEV) {
    return `/src/image/runes/${filename}`;
  }
  // En production avec Electron (fichier chargé depuis file://)
  return `./src/image/runes/${filename}`;
}
