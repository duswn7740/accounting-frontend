import React from 'react'
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Layout from './layout/Layout';
import { Navigate, Route, Routes } from 'react-router-dom'
import Register from './pages/auth/Register'
import Home from './pages/Home'
import Header from './layout/Header'
import Login from './pages/auth/Login'
import CompanyManage from './pages/MyPage/CompanyManage'
import Profile from './pages/MyPage/Profile'
import CompanyRegister from './pages/Company/CompanyRegister'
import SalesPurchaseVoucher from './pages/Voucher/SalesPurchaseVoucher'
import CompanySearch from './pages/Company/CompanySearch'
import BusinessCompanyManage from './pages/MyPage/BusinessCompanyManage'
import ClientManage from './pages/Client/ClientManage'
import AccountManage from './pages/Account/AccountManage'
import VoucherEntry from './pages/Voucher/VoucherEntry'

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
          <Route path="mypage/profile" element={<Profile />} />
          <Route path="mypage/company/register" element={<CompanyRegister />} />
          <Route path="mypage/company/search" element={<CompanySearch />} />
          <Route path="mypage/company/manage" element={<CompanyManage />} />
          <Route path="mypage/company/business-manage" element={<BusinessCompanyManage />} />
          
          {/* 거래처 관리 - 추가! */}
          <Route path="clients/manage" element={<ClientManage />} />
          <Route path="accounts/manage" element={<AccountManage />} /> 
  
                    
          {/* 전표 */}
          <Route path="voucher/entry" element={<VoucherEntry />} />
          <Route path="voucher/sales-purchase" element={<SalesPurchaseVoucher />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
