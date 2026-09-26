const AppSelect = ({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = "Select...",
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

      <select
        id={name}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        disabled={disabled}
        className={`
                    select
                    select-bordered
                    w-full
                    ${error ? "select-error" : ""}
                `}
      >
        <option value="">{placeholder}</option>

        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <label className="label">
          <span
            className="
                            label-text-alt
                            text-error
                        "
          >
            {error}
          </span>
        </label>
      )}
    </div>
  );
};

export default AppSelect;
