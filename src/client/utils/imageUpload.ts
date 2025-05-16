/**
 * Utility functions for handling image uploads and previews
 */

// Create a reusable function to handle file changes for image uploads
export const handleFileChange = (
  file: File,
  setFile: (file: File | null) => void,
  setPreview: (preview: string | null) => void,
  setIsDeleted: (isDeleted: boolean) => void
): (() => void) => {
  setFile(file);
  setIsDeleted(false);
  
  // Create a preview using object URL for better performance
  const objectUrl = URL.createObjectURL(file);
  setPreview(objectUrl);
  
  // Return cleanup function
  return () => URL.revokeObjectURL(objectUrl);
};

// Create a reusable function to handle image deletion
export const handleImageDelete = (
  setFile: (file: File | null) => void,
  setPreview: (preview: string | null) => void,
  setIsDeleted: (isDeleted: boolean) => void
): void => {
  setFile(null);
  setPreview(null);
  setIsDeleted(true);
};

// Create a reusable function to prepare form data with images
export const prepareFormDataWithImages = (
  textFields: Record<string, string>,
  images: Record<string, { 
    file: File | null, 
    isDeleted: boolean, 
    fieldName: string,
    deleteFlag: string
  }>
): FormData => {
  const formData = new FormData();
  
  // Append text fields
  Object.entries(textFields).forEach(([key, value]) => {
    formData.append(key, value || '');
  });
  
  // Process each image
  Object.entries(images).forEach(([key, { file, isDeleted, fieldName, deleteFlag }]) => {
    // Append image if selected
    if (file) {
      formData.append(fieldName, file);
    }
    
    // Add deletion flag if needed
    if (isDeleted) {
      formData.append(deleteFlag, 'true');
    }
  });
  
  return formData;
}; 