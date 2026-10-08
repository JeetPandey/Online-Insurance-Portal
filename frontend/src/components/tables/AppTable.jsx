import TableEmptyState from "./TableEmptyState";
import TableLoader from "./TableLoader.jsx";

const AppTable = ({
  columns = [],
  data = [],
  loading = false,
  rowKey = "id",
  onRowClick,
}) => {
  return (
    <div className="w-full overflow-x-auto bg-base-100 rounded-xl border border-base-300 ">
      <table className="table table-zebra">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={column.className || ""}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <TableLoader colSpan={columns.length} />
          ) : data.length === 0 ? (
            <TableEmptyState colSpan={columns.length} />
          ) : (
            data.map((row, index) => (
              <tr
                key={row[rowKey] ?? index}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? "cursor-pointer" : ""}
              >
                {columns.map((column) => (
                  <td key={column.key}>
                    {column.render
                      ? column.render(row[column.key], row, index)
                      : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AppTable;
