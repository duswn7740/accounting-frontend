import styles from './Input.module.css';

function Input({
  type = 'text',
  value,
  onChange,
  onKeyDown,
  onBlur,
  onFocus,
  placeholder = '',
  disabled = false,
  readOnly = false,
  name,
  className = '',
  style = {}
}) {
  const inputClass = `${styles.input} ${className}`;

  return (
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
      onFocus={onFocus}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      className={inputClass}
      style={style}
    />
  );
}

export default Input;
