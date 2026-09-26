const TableEmptyState = ({ colSpan, message = "No records found" }) => {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="text-center py-12 opacity-60 ">
        {message}
      </td>
    </tr>
  );
};

export default TableEmptyState;
