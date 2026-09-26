const AppTextarea = ({
  label,
  name,
  value,
  onChange,
  placeholder = "",
  rows = 4,
  error = "",
  required = false,
  disabled = false,
}) => {
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

      <textarea
        id={name}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={`
                    textarea
                    textarea-bordered
                    w-full
                    ${error ? "textarea-error" : ""}
                `}
      />

      {error && (
        <label className="label">
          <span className="label-text-alt text-error">{error}</span>
        </label>
      )}
    </div>
  );
};

export default AppTextarea;
