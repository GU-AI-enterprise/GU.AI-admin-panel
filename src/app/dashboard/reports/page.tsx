"use client";

import { useCallback, useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "../_config";
import { TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface AnalyticsResponse {
  currentTotal: number;
  previousTotal: number;
  percentChange: number;
  chartData: Record<string, unknown>[];
}

const getComparisonText = (range: string) => {
  if (range === "today") return "so với hôm qua";
  if (range === "7d") return "so với 7 ngày trước";
  if (range === "30d") return "so với 30 ngày trước";
  if (range === "1y") return "so với 1 năm trước";
  return "";
};

const MetricCard = ({ title, total, percentChange, formatFunc, comparisonText }: { title: string; total: number; percentChange: number; formatFunc?: (v: number) => string; comparisonText: string }) => {
  const isPositive = percentChange >= 0;
  return (
    <div className="flex flex-col gap-1 mb-4">
      <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
      <div className="flex items-end gap-3">
        <span className="text-2xl font-bold">{formatFunc ? formatFunc(total) : total}</span>
        <div className={`flex items-center text-xs font-medium px-1.5 py-0.5 rounded-md ${isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
          {isPositive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
          {Math.abs(percentChange)}%
        </div>
        <span className="text-xs text-muted-foreground mb-0.5">{comparisonText}</span>
      </div>
    </div>
  );
};

export default function ReportsPage() {
  const { session } = useAuth();
  
  const [range, setRange] = useState("7d"); // "today", "7d", "30d", "1y"
  
  const [jobData, setJobData] = useState<AnalyticsResponse | null>(null);
  const [revenueData, setRevenueData] = useState<AnalyticsResponse | null>(null);
  const [userData, setUserData] = useState<AnalyticsResponse | null>(null);
  const [creditData, setCreditData] = useState<AnalyticsResponse | null>(null);
  
  const [loading, setLoading] = useState(true);

  const hdrs = useCallback(() => ({
    Authorization: `Bearer ${session?.access_token}`,
  }), [session?.access_token]);

  const fetchAnalytics = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const [jobsRes, revRes, usersRes, creditsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/reports/jobs?range=${range}`, { headers: hdrs() }),
        fetch(`${API_URL}/api/admin/reports/revenue?range=${range}`, { headers: hdrs() }),
        fetch(`${API_URL}/api/admin/reports/users?range=${range}`, { headers: hdrs() }),
        fetch(`${API_URL}/api/admin/reports/credits?range=${range}`, { headers: hdrs() })
      ]);
      const jobsJson = await jobsRes.json();
      const revJson = await revRes.json();
      const usersJson = await usersRes.json();
      const creditsJson = await creditsRes.json();
      
      if (jobsJson.success) setJobData(jobsJson.data);
      if (revJson.success) setRevenueData(revJson.data);
      if (usersJson.success) setUserData(usersJson.data);
      if (creditsJson.success) setCreditData(creditsJson.data);
    } catch (e) {
      console.error("Failed to fetch reports", e);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, hdrs, range]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatXAxis = (v: any) => {
    if (typeof v !== 'string') return v;
    if (range === "today") return v; // e.g., "14:00"
    if (range === "1y") {
      const [year, month] = v.split("-");
      return month ? `T${month}/${year.slice(2)}` : v;
    }
    return v.length >= 10 ? v.slice(5, 10) : v; // e.g., "08-01"
  };

  const formatTooltipLabel = (v: any) => {
    if (range === "today") return `Giờ: ${v}`;
    if (range === "1y") return `Tháng: ${v}`;
    return `Ngày: ${v}`;
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col gap-6 animate-fade-in p-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Báo cáo</h1>
          <p className="text-sm text-muted-foreground">Thống kê chi tiết mức độ tăng trưởng của hệ thống.</p>
        </div>
        <div>
          <select 
            value={range} 
            onChange={e => setRange(e.target.value)}
            className="text-sm py-2 px-3 rounded-lg border border-border bg-background focus:border-primary focus:outline-none cursor-pointer shadow-sm"
          >
            <option value="today">Hôm nay (theo giờ)</option>
            <option value="7d">7 ngày qua</option>
            <option value="30d">30 ngày qua</option>
            <option value="1y">1 năm qua</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Lượng Job AI */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          {jobData && <MetricCard title="Lượng Job AI" total={jobData.currentTotal} percentChange={jobData.percentChange} formatFunc={(v) => v.toLocaleString()} comparisonText={getComparisonText(range)} />}
          <div style={{ width: '100%', height: 350 }}>
            {loading ? (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground animate-pulse bg-muted/20 rounded-lg">Đang tải dữ liệu...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={jobData?.chartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tickFormatter={formatXAxis} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <Tooltip labelFormatter={formatTooltipLabel} contentStyle={{ borderRadius: '8px', fontSize: '13px', border: '1px solid #e5e7eb' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', marginTop: '10px' }} />
                  <Area type="monotone" dataKey="success" name="Thành công" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSuccess)" />
                  <Area type="monotone" dataKey="failed" name="Thất bại" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorFailed)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Tiêu hao Credit */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          {creditData && <MetricCard title="Tiêu hao Credit" total={creditData.currentTotal} percentChange={creditData.percentChange} formatFunc={(v) => v.toLocaleString()} comparisonText={getComparisonText(range)} />}
          <div style={{ width: '100%', height: 350 }}>
            {loading ? (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground animate-pulse bg-muted/20 rounded-lg">Đang tải dữ liệu...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={creditData?.chartData || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCredit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tickFormatter={formatXAxis} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <Tooltip labelFormatter={formatTooltipLabel} formatter={(v) => [typeof v === 'number' ? v.toLocaleString() : v, "Credits"]} contentStyle={{ borderRadius: '8px', fontSize: '13px', border: '1px solid #e5e7eb' }} />
                  <Area type="monotone" dataKey="credits" name="Credits" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorCredit)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Tăng trưởng Người dùng */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          {userData && <MetricCard title="Người dùng mới đăng ký" total={userData.currentTotal} percentChange={userData.percentChange} formatFunc={(v) => v.toLocaleString()} comparisonText={getComparisonText(range)} />}
          <div style={{ width: '100%', height: 350 }}>
            {loading ? (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground animate-pulse bg-muted/20 rounded-lg">Đang tải dữ liệu...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userData?.chartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" tickFormatter={formatXAxis} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <Tooltip labelFormatter={formatTooltipLabel} formatter={(v) => [v, "Users"]} contentStyle={{ borderRadius: '8px', fontSize: '13px', border: '1px solid #e5e7eb' }} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                  <Bar dataKey="users" name="New Users" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Doanh thu PayOS */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          {revenueData && <MetricCard title="Doanh thu PayOS" total={revenueData.currentTotal} percentChange={revenueData.percentChange} formatFunc={(v) => `${v.toLocaleString("vi-VN")}đ`} comparisonText={getComparisonText(range)} />}
          <div style={{ width: '100%', height: 350 }}>
            {loading ? (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground animate-pulse bg-muted/20 rounded-lg">Đang tải dữ liệu...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData?.chartData || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <XAxis dataKey="date" tickFormatter={formatXAxis} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `${v / 1000}k`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <Tooltip labelFormatter={formatTooltipLabel} formatter={(v) => [typeof v === 'number' ? `${v.toLocaleString("vi-VN")}đ` : v, "Doanh thu"]} contentStyle={{ borderRadius: '8px', fontSize: '13px', border: '1px solid #e5e7eb' }} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                  <Bar dataKey="revenue" name="Doanh thu" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
