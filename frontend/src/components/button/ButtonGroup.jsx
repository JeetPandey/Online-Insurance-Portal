const ButtonGroup = ({ children, className = "" }) => {
  return (
    <div
      className={`flex items-center gap-2 ${className} `}>
      {children}
    </div>
  );
};
export default ButtonGroup;
