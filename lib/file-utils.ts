/**
 * Vérifie le type MIME et la taille d'un fichier avant envoi.
 */
export const validateFileType = (
  file: File,
  acceptedTypes: string[],
  maxSize: number,
): boolean => {
  if (!acceptedTypes.includes(file.type)) {
    return false;
  }

  return file.size <= maxSize;
};
