import { forwardRef } from 'react';
import styles from './Input.module.css';

const Input = forwardRef(({
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
}, ref) => {
  const inputClass = `${styles.input} ${className}`;

  return (
    <input
      ref={ref}
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
});

Input.displayName = 'Input';

export default Input;
