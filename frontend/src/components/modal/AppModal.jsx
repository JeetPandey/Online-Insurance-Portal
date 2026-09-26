import { FiX } from "react-icons/fi";

const AppModal = ({open,onClose,title,children,size = "md",footer = null,closeOnBackdrop = true,}) => {
  if (!open) {
    return null;
  }

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  };

  const handleBackdropClick = (event) => {
    if (closeOnBackdrop && event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 "
      onClick={handleBackdropClick}
    >
      <div
        className={`w-full ${sizeClasses[size]} max-h-[90vh] bg-base-100 rounded-xl shadow-2xl flex flex-col `}>
        {/* Header */}

        <div className=" flex items-center justify-between px-5 py-4 border-b border-base-300 ">
          <h2 className="font-semibold text-lg">{title}</h2>
          <button type="button" className="btn btn-ghost btn-sm btn-square"
            onClick={onClose}
          >
            <FiX size={20} />
          </button>
        </div>
        {/* Body */}
        <div
          className="flex-1 overflow-y-auto p-5 ">
          {children}
        </div>
        {/* Footer */}
        {footer && (
          <div className="px-5 py-4 border-t border-base-300">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppModal;
