import { useState, useCallback } from 'react';

export interface DeleteItemInfo {
  path: string;
  isDirectory: boolean;
}

type DeleteMode = 'single' | 'bulk';

interface UseDeleteConfirmationResult {
  showDeleteConfirmation: boolean;
  deleteItemInfo: DeleteItemInfo | null;
  deleteMode: DeleteMode;
  initiateItemDelete: (itemPath: string, isDirectory: boolean) => void;
  initiateBulkDelete: () => void;
  cancelDelete: () => void;
  confirmSingleDelete: (callback: (itemPath: string, isDirectory: boolean) => Promise<void>) => Promise<void>;
  confirmBulkDelete: (callback: () => Promise<void>) => Promise<void>;
}

export function useDeleteConfirmation(): UseDeleteConfirmationResult {
  // State for delete confirmation
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
  const [deleteItemInfo, setDeleteItemInfo] = useState<DeleteItemInfo | null>(null);
  const [deleteMode, setDeleteMode] = useState<DeleteMode>('single');

  // Handler to initiate item deletion process (shows confirmation)
  const initiateItemDelete = useCallback((itemPath: string, isDirectory: boolean) => {
    console.log('Initiating item delete:', itemPath);
    
    // First reset any existing state
    setDeleteMode('single');
    setDeleteItemInfo({ path: itemPath, isDirectory });
    
    // Force this to run after current event loop
    window.setTimeout(() => {
      console.log('Setting showDeleteConfirmation to true');
      setShowDeleteConfirmation(true);
    }, 50); // Use a slight delay to ensure it happens after all event handling
  }, []);

  // Handler to initiate bulk deletion process (shows confirmation)
  const initiateBulkDelete = useCallback(() => {
    console.log('Initiating bulk delete');
    
    // First reset any existing state
    setDeleteMode('bulk');
    
    // Force this to run after current event loop
    window.setTimeout(() => {
      console.log('Setting showDeleteConfirmation to true for bulk delete');
      setShowDeleteConfirmation(true);
    }, 50); // Use a slight delay to ensure it happens after all event handling
  }, []);

  // Handler to cancel deletion
  const cancelDelete = useCallback(() => {
    console.log('Cancelling delete operation');
    setShowDeleteConfirmation(false);
    setDeleteItemInfo(null);
  }, []);

  // Handler to confirm single item deletion
  const confirmSingleDelete = useCallback(async (callback: (itemPath: string, isDirectory: boolean) => Promise<void>) => {
    if (!deleteItemInfo) return;
    
    const { path: itemPath, isDirectory } = deleteItemInfo;
    console.log(`Confirming deletion of: ${itemPath}`);
    
    setShowDeleteConfirmation(false);
    setDeleteItemInfo(null);
    
    // Execute the deletion callback
    await callback(itemPath, isDirectory);
  }, [deleteItemInfo]);

  // Handler to confirm bulk deletion
  const confirmBulkDelete = useCallback(async (callback: () => Promise<void>) => {
    console.log('Confirming bulk deletion');
    setShowDeleteConfirmation(false);
    
    // Execute the deletion callback
    await callback();
  }, []);

  return {
    showDeleteConfirmation,
    deleteItemInfo,
    deleteMode,
    initiateItemDelete,
    initiateBulkDelete,
    cancelDelete,
    confirmSingleDelete,
    confirmBulkDelete
  };
}