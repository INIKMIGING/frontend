// src/app/services/endpoints.js

export const ENDPOINTS = {
  // 1. Pintu Masuk / Autentikasi
  LOGIN: "/api/auth/login",
  
  // 2. Data Perangkat (Hosts) & Lokasi
  HOSTS: "/api/hosts/", 
  UPDATE_LOCATION: (hostId) => `/api/hosts/${hostId}/location`, // Rute PUT untuk edit lokasi
  
  // 3. Data Metrik/Sensor Zabbix (Items)
  ITEMS_BY_HOST: (hostId) => `/api/items/host/${hostId}`,
  ITEM_HISTORY: (itemId) => `/api/items/${itemId}/history`,
  ITEM_LAST: (itemId) => `/api/items/${itemId}/last`,

  // 4. Data Dashboard & Report (Kita siapkan tempatnya dulu)
  SUMMARY_REPORT: "/api/summary/report",
  METRIC_CHART: (itemId) => `/api/metrics/${itemId}/chart`,
  METRIC_LAST: (itemId) => `/api/metrics/${itemId}/last`,
};