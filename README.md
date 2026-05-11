# Network Monitoring Dashboard

A production-ready React network monitoring dashboard for NOC (Network Operations Center) operators.

## Features

- **Dashboard**: Overview of network health with key metrics and charts
- **Devices**: Manage and monitor all network devices (Grid/Table view)
- **Network Monitoring**: ICMP availability and response time tracking
- **Memory Monitoring**: Device memory utilization with threshold alerts
- **Temperature Monitoring**: Thermal monitoring with status alerts

## Architecture

### Frontend-Only with Backend-Ready Design

This application uses **dummy data only** via custom hooks. The architecture is designed for easy backend integration:

- **UI Components** receive data via props only (no hardcoded data)
- **Custom Hooks** manage data fetching and state
- **API Client Service** simulates backend calls with dummy data
- **To switch to real backend**: Only edit files in `/src/app/hooks/` and `/src/app/services/apiClient.js`

### Status Models

#### Network Monitoring
- **Status**: `up` / `down`
- **Visual Hints**: 
  - Mint green: Normal latency (<50ms)
  - Soft yellow: High latency (50-100ms)
  - Red: Critical/Timeout (>100ms)

#### Memory Monitoring
- **Status**: `healthy` / `warning` / `critical`
- **Thresholds**:
  - < 70%: Healthy
  - 70-85%: Warning
  - > 85%: Critical

#### Temperature Monitoring
- **Status**: `healthy` / `warning` / `critical`
- **Thresholds**:
  - < 60°C: Healthy
  - 60-75°C: Warning
  - > 75°C: Critical

## Project Structure

```
src/app/
├── pages/
│   ├── Dashboard.tsx          # Main dashboard with overview
│   ├── Devices.tsx            # Device management page
│   └── monitoring/
│       ├── MonitoringLayout.tsx
│       ├── Network.tsx        # Network/ICMP monitoring
│       ├── Memory.tsx         # Memory monitoring
│       └── Temperature.tsx    # Temperature monitoring
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx        # Navigation sidebar
│   │   ├── Topbar.tsx         # Top navigation bar
│   │   └── PageContainer.tsx  # Page wrapper
│   ├── cards/
│   │   ├── MetricCard.tsx     # Reusable metric display
│   │   └── DeviceStatusCard.tsx
│   └── charts/
│       ├── LineChart.tsx      # Line chart component
│       └── AreaChart.tsx      # Area chart component
├── hooks/
│   ├── useDevices.js          # Device data hook
│   ├── useNetworkMetrics.js   # Network metrics hook
│   ├── useMemoryMetrics.js    # Memory metrics hook
│   ├── useTemperatureMetrics.js
│   └── useDashboardSummary.js
├── services/
│   └── apiClient.js           # API simulation layer
└── App.tsx                    # Main app with routing
```

## Navigation

- **Dashboard**: Main overview page
- **Devices**: Device listing with Grid/Table toggle
- **Monitoring** (expandable menu):
  - Network
  - Memory
  - Temperature

All monitoring pages include:
- Search functionality
- Table ↔ Grid view toggle (default: Table)
- Status-based filtering
- Individual device detail modals with charts

## Color Theme

- **Primary**: Yellow (#facc15) - Indosat/IM3 identity
- **Healthy/Up**: Mint Green (#34d399)
- **Warning**: Soft Yellow (#fbbf24)
- **Critical/Down**: Red (#ef4444)
- **Background**: Dark theme (zinc-900/zinc-950)

## Technologies

- React 18 with functional components
- React Router for navigation
- Recharts for data visualization
- Tailwind CSS for styling
- Lucide React for icons

## Development

All data is currently generated via dummy data in `/src/app/services/apiClient.js`.

### Switching to Real Backend

1. Update `/src/app/services/apiClient.js` to call real API endpoints
2. Update hooks in `/src/app/hooks/` to handle authentication/authorization
3. Add proper error handling
4. UI components will work without changes

## Auto-Refresh

All monitoring pages auto-refresh every 30 seconds to simulate real-time updates.
