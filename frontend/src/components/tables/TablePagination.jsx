import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const TablePagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div
      className="flex items-center justify-between mt-4 ">
      <div className="text-sm opacity-60">
        Page {currentPage} of {totalPages}
      </div>
      <div className="join">
        <button
          className="join-item btn btn-sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <FiChevronLeft />
        </button>

        <button
          className="join-item btn btn-sm ">
          {currentPage}
        </button>

        <button
          className="join-item btn btn-sm"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <FiChevronRight />
        </button>
      </div>
    </div>
  );
};

export default TablePagination;
