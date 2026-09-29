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
import { ToastProvider } from './context/ToastContext';
import { AuditProvider } from './context/AuditContext';

import ErrorBoundary from './components/ui/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="Application Error">
      <ToastProvider>
        <WorkspaceProvider>
          <AuditProvider>
            <SidebarProvider>
              <Router>
                <Layout>
                <Routes>
                  <Route path="/" element={<Navigate to="/chat" replace />} />
                  <Route path="/chat" element={<ErrorBoundary fallbackTitle="Chat Error"><ChatView /></ErrorBoundary>} />
                  <Route path="/comparison" element={<ErrorBoundary fallbackTitle="Comparison Error"><ComparisonView /></ErrorBoundary>} />
                  <Route path="/review" element={<ErrorBoundary fallbackTitle="Review Queue Error"><ReviewQueueView /></ErrorBoundary>} />
                  <Route path="/metrics" element={<ErrorBoundary fallbackTitle="Metrics Error"><MetricsDashboard /></ErrorBoundary>} />
                  <Route path="/knowledge" element={<ErrorBoundary fallbackTitle="Knowledge Base Error"><KnowledgeBaseView /></ErrorBoundary>} />
                  <Route path="/integration" element={<ErrorBoundary fallbackTitle="Integration Error"><IntegrationView /></ErrorBoundary>} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsConditions />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </Router>
          </SidebarProvider>
        </AuditProvider>
      </WorkspaceProvider>
    </ToastProvider>
    </ErrorBoundary>
  );
}

