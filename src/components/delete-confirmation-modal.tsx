import { X } from 'lucide-react'

interface DeleteConfirmationModalProps {
  onConfirm: () => void
  onCancel: () => void
  title: string
  message: string
}

export function DeleteConfirmationModal({
  onConfirm,
  onCancel,
  title,
  message
}: DeleteConfirmationModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button 
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={onCancel}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <p className="mb-4">{message}</p>
        </div>

        <div className="p-4 border-t dark:border-gray-800 flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-800 dark:border-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}