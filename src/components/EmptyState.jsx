import styles from './EmptyState.module.css';

function EmptyState({ message = '데이터가 없습니다', className = '' }) {
  return (
    <div className={`${styles.emptyState} ${className}`}>
      <p>{message}</p>
    </div>
  );
}

export default EmptyState;
