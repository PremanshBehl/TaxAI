import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, AlertTriangle, CheckCircle, FileText, TrendingUp, DollarSign } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ title, value, icon: Icon, trend, colorClass }: any) => (
  <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-muted-foreground text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center text-sm">
        <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
        <span className="text-green-500 font-medium">{trend}%</span>
        <span className="text-muted-foreground ml-2">vs last week</span>
      </div>
    )}
  </div>
);

const Dashboard = () => {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/invoices/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(response.data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchData();
  }, [token]);

  if (loading || !data) {
    return <div className="animate-pulse space-y-6">
      <div className="h-8 bg-muted rounded w-1/4"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-muted rounded-2xl"></div>)}
      </div>
    </div>;
  }

  const { stats, recentActivity, chartData } = data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">Track your invoice processing and GST compliance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Invoices" 
          value={stats.total} 
          icon={FileText} 
          colorClass="bg-blue-500/10 text-blue-500" 
        />
        <StatCard 
          title="Valid Compliant" 
          value={stats.valid} 
          icon={CheckCircle} 
          colorClass="bg-green-500/10 text-green-500" 
        />
        <StatCard 
          title="GST Warnings" 
          value={stats.invalid} 
          icon={AlertTriangle} 
          colorClass="bg-yellow-500/10 text-yellow-500" 
        />
        <StatCard 
          title="Total Processed" 
          value={`$${(stats.totalAmount || 0).toLocaleString()}`} 
          icon={DollarSign} 
          colorClass="bg-primary/10 text-primary" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-semibold text-lg">Processing Volume</h3>
              <p className="text-sm text-muted-foreground">Invoices processed last 7 days</p>
            </div>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#888" tickLine={false} axisLine={false} />
                <YAxis stroke="#888" tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="valid" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                <Bar dataKey="invalid" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-semibold text-lg">Recent Activity</h3>
              <p className="text-sm text-muted-foreground">Latest scanned invoices</p>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto pr-2 space-y-4">
            {recentActivity.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No recent activity. Upload an invoice to get started.</div>
            ) : recentActivity.map((invoice: any) => (
              <div key={invoice._id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${invoice.validationStatus !== 'valid' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                    {invoice.validationStatus !== 'valid' ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{invoice.invoiceNumber || 'Unknown Number'}</p>
                    <p className="text-xs text-muted-foreground">{invoice.vendorName || 'Unknown Vendor'} • {new Date(invoice.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">${(invoice.totalAmount || 0).toFixed(2)}</p>
                  <p className={`text-xs ${invoice.validationStatus !== 'valid' ? 'text-red-500' : 'text-green-500'}`}>
                    {invoice.validationStatus !== 'valid' ? 'Validation Issue' : 'Verified'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
