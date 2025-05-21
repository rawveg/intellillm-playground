import { Trash2 } from 'lucide-react';
import React from 'react';

interface DeleteButtonProps {
  onDelete: () => void;
  isDirectory?: boolean;
}

export function DeleteButton({ onDelete, isDirectory = false }: DeleteButtonProps) {
  // Handle the click event with strict isolation from parent events
  const handleDeleteClick = (e: React.MouseEvent) => {
    // Prevent event propagation at all levels
    e.preventDefault();
    e.stopPropagation();
    
    if (e.nativeEvent) {
      e.nativeEvent.preventDefault();
      e.nativeEvent.stopImmediatePropagation();
      e.nativeEvent.stopPropagation();
    }
    
    // Call the onDelete callback
    onDelete();
    
    // Return false to prevent any default behavior
    return false;
  };
  
  return (
    <div 
      className="delete-button-wrapper relative z-30" 
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
      style={{ position: 'relative', isolation: 'isolate' }}
    >
      <button
        type="button"
        className="p-1 hover:text-red-500 dark:hover:text-red-400"
        data-testid="delete-button"
        onClick={handleDeleteClick}
        title={`Delete ${isDirectory ? 'folder' : 'prompt'}`}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}