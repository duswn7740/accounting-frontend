import styles from './Select.module.css';

function Select({
  value,
  onChange,
  name,
  disabled = false,
  className = '',
  children,
  style = {}
}) {
  const selectClass = `${styles.select} ${className}`;

  return (
    <select
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={selectClass}
      style={style}
    >
      {children}
    </select>
  );
}

export default Select;
