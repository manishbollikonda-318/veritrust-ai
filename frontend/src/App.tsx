import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ChatView from './components/chat/ChatView';
import MetricsDashboard from './components/metrics/MetricsDashboard';
import KnowledgeBaseView from './components/knowledge/KnowledgeBaseView';
import ComparisonView from './components/comparison/ComparisonView';
import IntegrationView from './components/integration/IntegrationView';
import ReviewQueueView from './components/review/ReviewQueueView';
import PrivacyPolicy from './components/pages/PrivacyPolicy';
import TermsConditions from './components/pages/TermsConditions';
import NotFound from './components/pages/NotFound';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { SidebarProvider } from './context/SidebarContext';

export default function App() {
  return (
    <WorkspaceProvider>
      <SidebarProvider>
        <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/chat" replace />} />
            <Route path="/chat" element={<ChatView />} />
            <Route path="/comparison" element={<ComparisonView />} />
            <Route path="/review" element={<ReviewQueueView />} />
            <Route path="/metrics" element={<MetricsDashboard />} />
            <Route path="/knowledge" element={<KnowledgeBaseView />} />
            <Route path="/integration" element={<IntegrationView />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsConditions />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </Router>
      </SidebarProvider>
    </WorkspaceProvider>
  );
}

