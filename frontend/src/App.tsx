import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './Navbar'
import CampaignsList from './pages/CampaignsList'
import CampaignDetail from './pages/CampaignDetail'
import MyInvestments from './pages/MyInvestments'
import MerchantDashboard from './pages/MerchantDashboard'
import AuditPage from './pages/AuditPage'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<CampaignsList />} />
        <Route path="/campaigns/:id" element={<CampaignDetail />} />
        <Route path="/invest" element={<MyInvestments />} />
        <Route path="/merchant" element={<MerchantDashboard />} />
        <Route path="/audit" element={<AuditPage />} />
      </Routes>
    </BrowserRouter>
  )
}
