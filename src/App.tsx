import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { Layout } from './components/Layout'
import { useMe } from './store'
import Login from './pages/Login'
import Feed from './pages/Feed'
import Explore from './pages/Explore'
import ProductPage from './pages/ProductPage'
import ManufacturerPage from './pages/ManufacturerPage'
import Assistant from './pages/Assistant'
import Dashboard from './pages/Dashboard'
import NewProduct from './pages/NewProduct'

function RequireAuth({ children, role }: { children: ReactNode; role?: 'manufacturer' }) {
  const me = useMe()
  if (!me) return <Navigate to="/login" replace />
  if (role && me.role !== role) return <Navigate to="/" replace />
  return children
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index element={<Feed />} />
          <Route path="explore" element={<Explore />} />
          <Route path="products/:id" element={<ProductPage />} />
          <Route path="m/:id" element={<ManufacturerPage />} />
          <Route path="assistant/:chatId?" element={<Assistant />} />
          <Route path="dashboard" element={<RequireAuth role="manufacturer"><Dashboard /></RequireAuth>} />
          <Route path="dashboard/new" element={<RequireAuth role="manufacturer"><NewProduct /></RequireAuth>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
