# Quick Start Guide

## Running the Application

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

3. **Open your browser**:
   Navigate to `http://localhost:5173` (or the port shown in your terminal)

## Navigation Guide

### Main Menu

1. **Dashboard** (/)
   - Overview of all network metrics
   - Summary cards showing total devices, online/offline status
   - Network response time chart
   - System status overview

2. **Devices** (/devices)
   - Complete list of all network devices
   - Toggle between Grid and Table views
   - Search by device name, type, location, or IP
   - View device status (online/offline)

3. **Monitoring** (expandable menu)
   - Click to expand sub-menu items
   - **Network** (/monitoring/network)
     - ICMP/Ping monitoring
     - Response time tracking
     - Packet loss statistics
     - Up/Down status
   
   - **Memory** (/monitoring/memory)
     - Memory utilization monitoring
     - Healthy/Warning/Critical status
     - Usage percentage tracking
     - Historical charts
   
   - **Temperature** (/monitoring/temperature)
     - Device temperature monitoring
     - Thermal threshold alerts
     - Healthy/Warning/Critical status
     - Temperature history

## Features Overview

### Search Functionality
All pages with device listings include a search bar that filters by:
- Device name
- Device type
- Location
- IP address (where applicable)

### View Modes
Monitoring pages (Network, Memory, Temperature) support two view modes:
- **Table View** (default): Tabular display with sortable columns
- **Grid View**: Card-based layout for visual browsing

Toggle between views using the buttons in the top-right corner.

### Device Details
Click "View Chart" or "View Details" on any device to see:
- Detailed metrics
- 24-hour historical data
- Interactive charts
- Status breakdown

### Auto-Refresh
All monitoring pages automatically refresh data every 30 seconds to show the latest metrics.

## Understanding Status Colors

### Network Monitoring
- 🟢 **Green (Mint)**: Device is UP, normal latency
- 🟡 **Yellow**: Device is UP, high latency
- 🔴 **Red**: Device is DOWN or unreachable

### Memory Monitoring
- 🟢 **Green (Mint)**: Healthy (<70% usage)
- 🟡 **Yellow**: Warning (70-85% usage)
- 🔴 **Red**: Critical (>85% usage)

### Temperature Monitoring
- 🟢 **Green (Mint)**: Healthy (<60°C)
- 🟡 **Yellow**: Warning (60-75°C)
- 🔴 **Red**: Critical (>75°C)

## Dummy Data Information

Currently, all data is **simulated** for demonstration purposes:
- 25 devices with various types (Router, Switch, Firewall, etc.)
- Random but realistic metrics
- 24-hour historical data for charts
- Auto-generated alerts and status changes

This allows you to explore all features without a backend connection.

## Customization Tips

### Changing the Refresh Interval
Edit the hooks in `/src/app/hooks/`:
```javascript
// Change 30000 (30 seconds) to your preferred interval
const interval = setInterval(loadMetrics, 30000);
```

### Modifying Status Thresholds
Edit `/src/app/services/apiClient.js`:
```javascript
// Memory thresholds
if (usagePercent >= 85) status = 'critical';
else if (usagePercent >= 70) status = 'warning';

// Temperature thresholds
if (currentTemp >= 75) status = 'critical';
else if (currentTemp >= 60) status = 'warning';
```

### Adding More Device Types
Edit the `deviceTypes` array in `/src/app/services/apiClient.js`:
```javascript
const deviceTypes = ['Router', 'Switch', 'Firewall', 'Access Point', 'Server', 'Your New Type'];
```

## Troubleshooting

### Charts Not Displaying
- Ensure `recharts` is installed
- Check browser console for errors
- Verify data format matches expected structure

### Navigation Not Working
- Ensure `react-router` is properly installed
- Check that `BrowserRouter` is wrapping the app in `App.tsx`

### Styling Issues
- Verify Tailwind CSS is properly configured
- Check that `/src/styles/index.css` imports are correct
- Ensure dark mode classes are applied

## Next Steps

- Review `/BACKEND_INTEGRATION.md` to connect to a real backend
- Explore the codebase starting from `/src/app/App.tsx`
- Check individual components in `/src/app/components/`
- Customize the theme in `/src/styles/theme.css`

## Support

For questions or issues:
1. Check the `/README.md` for architecture overview
2. Review `/BACKEND_INTEGRATION.md` for API integration
3. Examine the code comments in each file
