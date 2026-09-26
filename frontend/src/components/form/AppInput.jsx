const AppInput = ({label,name,value,onChange,type = "text",placeholder = "",error = "",required = false,disabled = false,}) => {
  return (
    <div className="form-control w-full">
      {label && (
        <label className="label" htmlFor={name}>
          <span className="label-text">
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </span>
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`
                    input
                    input-bordered
                    w-full
                    ${error ? "input-error" : ""}
                `}
      />

      {error && (
        <label className="label">
          <span
            className="label-text-alt text-error">
            {error}
          </span>
        </label>
      )}
    </div>
  );
};

export default AppInput;
