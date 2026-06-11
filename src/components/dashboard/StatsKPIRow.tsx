interface KPI {
  label:    string;
  value:    string | number;
  sub?:     string;
  color?:   string;
}

export default function StatsKPIRow({ stats }: {
  stats: {
    totalListings:    number;
    approvedListings: number;
    pendingListings:  number;
    totalBookings:    number;
    todayBookings:    number;
    monthRevenue:     number;
  };
}) {
  const kpis: KPI[] = [
    {
      label: 'My Listings',
      value: stats.totalListings,
      sub:   `${stats.approvedListings} approved · ${stats.pendingListings} pending`,
      color: 'bg-green-50 border-green-100',
    },
    {
      label: 'Total Bookings',
      value: stats.totalBookings,
      sub:   `${stats.todayBookings} today`,
      color: 'bg-blue-50 border-blue-100',
    },
    {
      label: 'Revenue This Month',
      value: `₹${stats.monthRevenue.toLocaleString('en-IN')}`,
      sub:   'Confirmed bookings only',
      color: 'bg-yellow-50 border-yellow-100',
    },
    {
      label: 'Occupancy',
      value: stats.totalBookings > 0 ? 'Active' : 'No bookings yet',
      sub:   'Check bookings tab for details',
      color: 'bg-purple-50 border-purple-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((k) => (
        <div key={k.label} className={`rounded-xl border p-4 ${k.color}`}>
          <p className="text-xs text-gray-500 mb-1">{k.label}</p>
          <p className="text-2xl font-bold text-gray-900">{k.value}</p>
          {k.sub && <p className="text-xs text-gray-400 mt-1">{k.sub}</p>}
        </div>
      ))}
    </div>
  );
}
