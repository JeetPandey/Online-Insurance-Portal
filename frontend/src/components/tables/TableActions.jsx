import { FiEdit, FiTrash2, FiEye } from "react-icons/fi";

import IconButton from "../button/IconButton";
import ButtonGroup from "../button/ButtonGroup";

const TableActions = ({
  onView,
  onEdit,
  onDelete,
  view = true,
  edit = true,
  remove = true,
}) => {
  return (
    <ButtonGroup>
      {view && onView && (
        <IconButton icon={<FiEye />} tooltip="View" onClick={onView} />
      )}

      {edit && onEdit && (
        <IconButton icon={<FiEdit />} tooltip="Edit" onClick={onEdit} />
      )}

      {remove && onDelete && (
        <IconButton
          icon={<FiTrash2 />}
          tooltip="Delete"
          variant="ghost"
          onClick={onDelete}
          className="text-error"
        />
      )}
    </ButtonGroup>
  );
};

export default TableActions;
