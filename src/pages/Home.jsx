import React from 'react'

const Home = () => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: 'white',
      minHeight: '500px'  // ← 높이 확인용
    }}>
      <h1>대시보드</h1>
      home
    </div>
  );
}

export default Home