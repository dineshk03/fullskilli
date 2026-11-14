import { createContext, useContext } from 'react';
export const UploadContext = createContext(null);
export const useUpload = () => {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  return context;
};
export default UploadContext;
