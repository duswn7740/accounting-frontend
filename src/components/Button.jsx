import styles from './Button.module.css';

function Button({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  ...rest  // 나머지 모든 props (tabIndex, onMouseDown 등)
}) {
  const buttonClass = `${styles.button} ${styles[variant]} ${styles[size]} ${className}`;

  return (
    <button
      type={type}
      className={buttonClass}
      onClick={onClick}
      disabled={disabled}
      {...rest}  // 나머지 props를 button 요소에 전달
    >
      {children}
    </button>
  );
}

export default Button;
