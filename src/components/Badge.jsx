import styles from './Badge.module.css';

function Badge({ variant = 'default', children, className = '' }) {
  const badgeClass = `${styles.badge} ${styles[variant]} ${className}`;

  return (
    <span className={badgeClass}>
      {children}
    </span>
  );
}

export default Badge;
