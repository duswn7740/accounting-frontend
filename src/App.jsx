import React from 'react'
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Layout from './layout/Layout';
import { Route, Routes } from 'react-router-dom'
import Register from './pages/auth/Register'
import Home from './pages/Home'
import Header from './layout/Header'
import Login from './pages/auth/Login'
import CompanyManage from './pages/MyPage/CompanyManage'
import Profile from './pages/MyPage/Profile'
import CompanyRegister from './pages/Company/CompanyRegister'
import GeneralVoucher from './pages/voucher/GeneralVoucher'
import SalesPurchaseVoucher from './pages/voucher/SalesPurchaseVoucher'
import CompanySearch from './pages/Company/CompanySearch'

function App() {
  
  return (
    <>
      <Routes>
        {/* 로그인/회원가입 (Layout 없이) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Layout 적용 (Header + Sidebar) */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          
          {/* 마이페이지 */}
          <Route path="mypage" element={<CompanyManage />} />
          <Route path="profile" element={<Profile />} />
          
          {/* 회사 */}
          <Route path="company/register" element={<CompanyRegister />} />
          <Route path="company/search" element={<CompanySearch />} />
          
          {/* 전표 */}
          <Route path="voucher/general" element={<GeneralVoucher />} />
          <Route path="voucher/sales-purchase" element={<SalesPurchaseVoucher />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
