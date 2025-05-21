import { AlertTriangle, X } from 'lucide-react'

interface ConfirmationModalProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  isDestructive?: boolean
}

export function ConfirmationModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isDestructive = true
}: ConfirmationModalProps) {
  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 delete-confirmation-modal" 
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
      style={{ isolation: 'isolate' }}
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md flex flex-col overflow-hidden shadow-lg" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center">
            {isDestructive && (
              <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
            )}
            {title}
          </h2>
          <button 
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <p className="text-gray-700 dark:text-gray-300">{message}</p>
        </div>

        <div className="p-4 border-t dark:border-gray-800 flex justify-end space-x-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
            className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-800 dark:border-gray-700"
          >
            {cancelLabel}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onConfirm();
            }}
            className={`px-4 py-2 text-white rounded ${
              isDestructive 
                ? 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800' 
                : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}