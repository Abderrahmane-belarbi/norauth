import { Route, Routes } from 'react-router-dom'
import './App.css'
import MainLayout from './layouts/main-layout'
import Login from './pages/login'
import { Register } from './pages/register'
import ForgotPassword from './pages/forgot-password'
import { VerifyEmail } from './pages/verify-email'

function App() {

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<section className="form-panel">Home</section>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>
    </Routes>
  )
}

export default App
