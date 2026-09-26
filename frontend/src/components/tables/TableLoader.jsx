const TableLoader = ({ colSpan, rows = 5 }) => {
  return (
    <>
      {Array.from({
        length: rows,
      }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({
            length: colSpan,
          }).map((_, columnIndex) => (
            <td key={columnIndex}>
              <div
                className="h-4 bg-base-300 rounded animate-pulse "/>
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

export default TableLoader;
