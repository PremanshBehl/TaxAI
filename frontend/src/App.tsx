import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-background text-foreground"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-background text-foreground dark">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="upload" element={<Upload />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="invoices/:id" element={<InvoiceDetail />} />
            </Route>
          </Routes>
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
