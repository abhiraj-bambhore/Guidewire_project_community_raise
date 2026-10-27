import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './Navbar'
import CampaignsList from './pages/CampaignsList'
import CampaignDetail from './pages/CampaignDetail'
import MyInvestments from './pages/MyInvestments'
import MerchantDashboard from './pages/MerchantDashboard'
import AuditPage from './pages/AuditPage'
import DraftingLayerPage from './pages/DraftingLayerPage'
import MiroFishGraphPage from './pages/MiroFishGraphPage'
import PolicyCenterPage from './pages/PolicyCenterPage'
import ClaimCenterPage from './pages/ClaimCenterPage'
import BillingCenterPage from './pages/BillingCenterPage'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<CampaignsList />} />
        <Route path="/campaigns/:id" element={<CampaignDetail />} />
        <Route path="/drafting" element={<DraftingLayerPage />} />
        <Route path="/mirofish" element={<MiroFishGraphPage />} />
        <Route path="/invest" element={<MyInvestments />} />
        <Route path="/merchant" element={<MerchantDashboard />} />
        <Route path="/audit" element={<AuditPage />} />
        <Route path="/policycenter" element={<PolicyCenterPage />} />
        <Route path="/claimcenter" element={<ClaimCenterPage />} />
        <Route path="/billingcenter" element={<BillingCenterPage />} />
      </Routes>
    </BrowserRouter>
  )
}
