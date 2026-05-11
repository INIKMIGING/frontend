# Backend Integration Guide

## Quick Start: Switching from Dummy Data to Real Backend

This guide explains how to connect the Network Monitoring Dashboard to a real backend API.

## Architecture Overview

```
UI Components (read-only)
    ↓ (receive props)
Custom Hooks (data management)
    ↓ (call functions)
API Client Service (network layer)
    ↓ (HTTP requests)
Backend API
```

## Step-by-Step Integration

### 1. Update API Client Service

File: `/src/app/services/apiClient.js`

Replace the dummy functions with real API calls:

```javascript
// Before (dummy data)
export const fetchDevices = async () => {
  await delay(300);
  return Array.from({ length: 25 }, ...); // Generates fake data
};

// After (real backend)
export const fetchDevices = async () => {
  const response = await fetch('https://your-api.com/api/devices', {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch devices');
  }
  
  return response.json();
};
```

### 2. Add Authentication

Create `/src/app/services/auth.js`:

```javascript
export const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

export const setAuthToken = (token) => {
  localStorage.setItem('auth_token', token);
};
```

### 3. Update Each Hook (Optional)

The hooks in `/src/app/hooks/` are already structured correctly.
You may want to add:

- Better error handling
- Retry logic
- Loading states
- Token refresh logic

Example enhancement:

```javascript
// /src/app/hooks/useDevices.js
import { useState, useEffect } from 'react';
import { fetchDevices } from '../services/apiClient';

export const useDevices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDevices = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchDevices();
        setDevices(data);
      } catch (err) {
        setError(err.message);
        // Optional: Log to error tracking service
        console.error('Failed to load devices:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDevices();
  }, []);

  return { devices, loading, error, refetch: loadDevices };
};
```

### 4. Expected API Response Formats

#### GET /api/devices

```json
[
  {
    "id": "device-1",
    "name": "Device-001",
    "type": "Router",
    "location": "Jakarta",
    "ip": "192.168.1.1",
    "status": "online",
    "lastSeen": "2026-02-24T10:30:00Z"
  }
]
```

#### GET /api/metrics/network

```json
[
  {
    "deviceId": "device-1",
    "deviceName": "Device-001",
    "deviceType": "Router",
    "location": "Jakarta",
    "ip": "192.168.1.1",
    "status": "up",
    "avgPing": 25.5,
    "packetLoss": 0.5,
    "history": [
      {
        "timestamp": "2026-02-24T10:00:00Z",
        "responseTime": 24.2
      }
    ],
    "lastChecked": "2026-02-24T10:30:00Z"
  }
]
```

#### GET /api/metrics/memory

```json
[
  {
    "deviceId": "device-1",
    "deviceName": "Device-001",
    "deviceType": "Router",
    "location": "Jakarta",
    "status": "healthy",
    "usagePercent": 65.5,
    "totalMemory": 16384,
    "usedMemory": 10731,
    "availableMemory": 5653,
    "history": [
      {
        "timestamp": "2026-02-24T10:00:00Z",
        "usagePercent": 64.2
      }
    ],
    "lastChecked": "2026-02-24T10:30:00Z"
  }
]
```

#### GET /api/metrics/temperature

```json
[
  {
    "deviceId": "device-1",
    "deviceName": "Device-001",
    "deviceType": "Router",
    "location": "Jakarta",
    "status": "healthy",
    "currentTemp": 55.5,
    "maxTemp": 80,
    "history": [
      {
        "timestamp": "2026-02-24T10:00:00Z",
        "temperature": 54.8
      }
    ],
    "lastChecked": "2026-02-24T10:30:00Z"
  }
]
```

#### GET /api/dashboard/summary

```json
{
  "totalDevices": 25,
  "onlineDevices": 22,
  "offlineDevices": 3,
  "criticalAlerts": 2,
  "warningAlerts": 5,
  "avgResponseTime": 28.5,
  "networkUptime": 99.2
}
```

## Status Calculation Logic

The backend should calculate status based on these rules:

### Network Status
- `up`: Device responds to ping
- `down`: Device does not respond

### Memory Status
- `healthy`: < 70% usage
- `warning`: 70-85% usage
- `critical`: > 85% usage

### Temperature Status
- `healthy`: < 60°C
- `warning`: 60-75°C
- `critical`: > 75°C

## Testing Checklist

- [ ] API endpoints return correct data structure
- [ ] Authentication tokens are properly handled
- [ ] Error responses are properly formatted
- [ ] CORS is configured for your frontend domain
- [ ] Rate limiting is considered
- [ ] WebSocket connection (optional, for real-time updates)

## Optional Enhancements

### Real-Time Updates

Replace polling with WebSockets:

```javascript
// /src/app/hooks/useNetworkMetrics.js
useEffect(() => {
  const ws = new WebSocket('wss://your-api.com/ws/metrics/network');
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    setMetrics(data);
  };
  
  return () => ws.close();
}, []);
```

### Pagination

Add pagination for large datasets:

```javascript
export const fetchDevices = async (page = 1, limit = 25) => {
  const response = await fetch(
    `https://your-api.com/api/devices?page=${page}&limit=${limit}`
  );
  return response.json();
};
```

## Summary

- ✅ UI components are backend-agnostic
- ✅ Only 6 files need modification for real backend
- ✅ Data structure is well-defined and documented
- ✅ Authentication layer is easy to add
- ✅ No UI components need to be rewritten
