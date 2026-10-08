const IconButton = ({
  icon,
  tooltip,
  variant = "ghost",
  size = "sm",
  onClick,
  disabled = false,
  className = "",
}) => {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`btn btn-${variant} btn-${size} btn-square ${className} `}title={tooltip}>{icon}</button>
  );
};

export default IconButton;
