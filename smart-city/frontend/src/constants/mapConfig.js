export const MAP_CONFIG = {
  center: [20.5937, 78.9629], // India National Center
  zoom: 4,
  minZoom: 2,
  maxZoom: 18,
  tileUrl: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  lightTileUrl: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
};

export const WARD_COLORS = {
  healthy:  '#10b981',  // Emerald Green  — 0-10 open complaints
  moderate: '#f59e0b',  // Amber Yellow — 11-25
  high:     '#ef4444',  // Red-Orange — 26-50
  critical: '#b91c1c',  // Deep Red — 51+
};

export const PRIORITY_COLORS = {
  Critical: '#ef4444',
  High:     '#f59e0b',
  Medium:   '#3b82f6',
  Low:      '#10b981',
};
