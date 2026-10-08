import { FiLoader } from "react-icons/fi";

const AppButton = ({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  form,
  onClick,
  className = "",
}) => {
  const variantClasses = {primary: "btn-primary",secondary: "btn-secondary",success: "btn-success",warning: "btn-warning",error: "btn-error",outline: "btn-outline",ghost: "btn-ghost",};
  const sizeClasses = {xs: "btn-xs",sm: "btn-sm",md: "btn-md",lg: "btn-lg",};

  return (
    <button
      type={type}
      form={form}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
                btn
                ${variantClasses[variant]}
                ${sizeClasses[size]}
                ${fullWidth ? "w-full" : ""}
                ${className}
            `}
    >
      {loading && <FiLoader className="animate-spin" />}

      {children}
    </button>
  );
};

export default AppButton;
