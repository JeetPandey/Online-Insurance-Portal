import { FiAlertCircle } from "react-icons/fi";

const ErrorState = ({
  title = "Something went wrong",
  message = "Unable to load the requested data.",
  action = null,
}) => {
  return (
    <div
      className="py-16 flex flex-col items-center justify-center text-center">
      <div className="w-14 h-14 rounded-full bg-error/10 text-error flex items-center justify-center mb-4">
        <FiAlertCircle size={25} />
      </div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-sm opacity-60 mt-1">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};

export default ErrorState;
