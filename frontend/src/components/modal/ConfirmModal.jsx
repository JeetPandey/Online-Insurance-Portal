import { FiAlertTriangle } from "react-icons/fi";
import AppModal from "./AppModal";
import AppButton from "../button/AppButton";
import ButtonGroup from "../button/ButtonGroup";

const ConfirmModal = ({open,onClose,onConfirm,title = "Confirm Action",message = "Are you sure you want to continue?",loading = false,}) => {
  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <ButtonGroup className="justify-end">
          <AppButton variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </AppButton>

          <AppButton variant="error" loading={loading} onClick={onConfirm}>
            Confirm
          </AppButton>
        </ButtonGroup>
      }
    >
      <div className="flex gap-4">
        <div
          className="w-10 h-10 shrink-0 rounded-full bg-error/10 text-error flex items-center justify-center ">
          <FiAlertTriangle size={20} />
        </div>
        <p className="text-sm opacity-70">{message}</p>
      </div>
    </AppModal>
  );
};
export default ConfirmModal;
