import React, { useState, useCallback } from 'react';
import { useFilters } from '../hooks/useFilters';
import { useMapData } from '../hooks/useMapData';
import { useSocket } from '../hooks/useSocket';
import TopBar from '../components/panels/TopBar';
import LeftPanel from '../components/panels/LeftPanel';
import RightPanel from '../components/panels/RightPanel';
import BottomBar from '../components/panels/BottomBar';
import LeafletMap from '../components/map/LeafletMap';
import WardDetailPanel from '../components/panels/WardDetailPanel';

export const CommandCenter = () => {
  const { filters, setFilter } = useFilters();
  const {
    wards,
    complaints,
    stats,
    loading,
    error,
    refreshData,
    handleNewComplaint,
    handleUpdateComplaint,
  } = useMapData(filters);

  // States
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'operations' | 'ai'
  const [mode, setMode] = useState('none'); // 'none' | 'submit' | 'complaint' | 'ward'
  const [selectedWard, setSelectedWard] = useState(null);
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);
  const [pickedLocation, setPickedLocation] = useState(null);
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [feedEvents, setFeedEvents] = useState([]);

  // Map state hooks - start zoomed out on India
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
  const [mapZoom, setMapZoom] = useState(4);
  const [mapBounds, setMapBounds] = useState(null);

  const [activeLayers, setActiveLayers] = useState({
    wards: true,
    labels: true,
    markers: true,
    heatmap: false,
  });

  // Callbacks
  const handleFeedEvent = useCallback((event) => {
    setFeedEvents((prev) => [event, ...prev].slice(0, 10));
  }, []);

  const { joinComplaintRoom, leaveComplaintRoom } = useSocket(
    handleNewComplaint,
    handleUpdateComplaint,
    handleFeedEvent
  );

  const handleDrillDown = useCallback((nextLevel, code) => {
    setFilter('level', nextLevel);
    setFilter('parentCode', code);
    
    if (nextLevel === 'STATE') {
      setMapCenter([15.3173, 75.7139]);
      setMapZoom(7);
    } else if (nextLevel === 'DISTRICT') {
      setMapCenter([12.9716, 77.5946]);
      setMapZoom(10);
    } else if (nextLevel === 'LOCAL_BODY') {
      setMapCenter([12.9716, 77.5946]);
      setMapZoom(12);
    }
    setMapBounds(null);
  }, [setFilter]);

  const handleBack = useCallback(() => {
    const currentLevel = filters.level;
    if (currentLevel === 'LOCAL_BODY') {
      handleDrillDown('DISTRICT', 'BLR');
    } else if (currentLevel === 'DISTRICT') {
      handleDrillDown('STATE', 'KA');
    } else if (currentLevel === 'STATE') {
      setFilter('level', 'NATIONAL');
      setFilter('parentCode', null);
      setMapCenter([20.5937, 78.9629]);
      setMapZoom(4);
      setMapBounds(null);
    }
  }, [filters.level, handleDrillDown, setFilter]);

  const handleWardClick = useCallback((ward) => {
    setMode('ward');
    setSelectedWard(ward);
    setSelectedComplaintId(null);
    setPickedLocation(null);
    setIsPickingLocation(false);
    setActiveTab('map'); // Keep map visible to show floating HUD
    
    // Zoom to ward polygon boundaries
    if (ward.boundary && ward.boundary.coordinates) {
      const coords = ward.boundary.coordinates[0];
      const lats = coords.map((c) => c[1]);
      const lngs = coords.map((c) => c[0]);
      const southWest = [Math.min(...lats), Math.min(...lngs)];
      const northEast = [Math.max(...lats), Math.max(...lngs)];
      setMapBounds([southWest, northEast]);
      setMapCenter(null);
    }
  }, []);

  const handleComplaintClick = useCallback((complaint) => {
    if (selectedComplaintId) {
      leaveComplaintRoom(selectedComplaintId);
    }
    setMode('complaint');
    setSelectedComplaintId(complaint.id);
    setSelectedWard(null);
    setPickedLocation(null);
    setIsPickingLocation(false);
    setActiveTab('ai'); // Switch to AI/Details tab on mobile
    
    joinComplaintRoom(complaint.id);

    if (complaint.lat != null && complaint.lng != null) {
      setMapCenter([complaint.lat, complaint.lng]);
      setMapZoom(16);
      setMapBounds(null);
    }
  }, [selectedComplaintId, joinComplaintRoom, leaveComplaintRoom]);

  const handleEventClick = useCallback((event) => {
    handleComplaintClick({
      id: event.id,
      lat: event.lat || (event.location === 'Indiranagar' ? 12.9718 : 12.9352),
      lng: event.lng || (event.location === 'Indiranagar' ? 77.6300 : 77.6245),
    });
  }, [handleComplaintClick]);

  const handleStartReporting = useCallback(() => {
    if (isPickingLocation) {
      setIsPickingLocation(false);
      setMode('none');
      setPickedLocation(null);
    } else {
      setMode('submit');
      setIsPickingLocation(true);
      setPickedLocation(null);
      setSelectedWard(null);
      setSelectedComplaintId(null);
      setActiveTab('ai'); // Switch to reporting form tab on mobile
      // Automatically drill down to municipal level if not already there, so coordinates pick works correctly
      if (filters.level !== 'LOCAL_BODY') {
        handleDrillDown('LOCAL_BODY', 'BBMP');
      }
    }
  }, [isPickingLocation, filters.level, handleDrillDown]);

  const handleLocationPicked = useCallback((coords) => {
    setPickedLocation(coords);
    setIsPickingLocation(false);
  }, []);

  const handleResetLocation = useCallback(() => {
    setPickedLocation(null);
  }, []);

  const handleClosePanel = useCallback(() => {
    if (mode === 'complaint' && selectedComplaintId) {
      leaveComplaintRoom(selectedComplaintId);
    }
    setMode('none');
    setSelectedWard(null);
    setSelectedComplaintId(null);
    setPickedLocation(null);
    setIsPickingLocation(false);
    setActiveTab('map'); // Return to map on close
  }, [mode, selectedComplaintId, leaveComplaintRoom]);

  const handleResetView = useCallback(() => {
    if (filters.level === 'NATIONAL') {
      setMapCenter([20.5937, 78.9629]);
      setMapZoom(4);
    } else if (filters.level === 'STATE') {
      setMapCenter([15.3173, 75.7139]);
      setMapZoom(7);
    } else {
      setMapCenter([12.9716, 77.5946]);
      setMapZoom(12);
    }
    setMapBounds(null);
  }, [filters.level]);

  const toggleLayer = useCallback((layerName) => {
    setActiveLayers((prev) => ({
      ...prev,
      [layerName]: !prev[layerName],
    }));
  }, []);

  const handleFocusCoordinates = useCallback((coords) => {
    setMapCenter(coords);
    setMapZoom(16);
    setMapBounds(null);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#050816] text-slate-100 overflow-hidden relative">
      {/* Top Navigation */}
      <TopBar
        stats={stats}
        filters={filters}
        setFilter={setFilter}
        activeLayers={activeLayers}
        toggleLayer={toggleLayer}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onStartReporting={handleStartReporting}
        isPickingLocation={isPickingLocation}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Filter desk + Wards list - Wrapped with responsive overlay rules */}
        <div className={`md:flex ${activeTab === 'operations' ? 'flex absolute inset-0 z-[1002] w-full bg-[#050816]/95 backdrop-blur-md' : 'hidden'} md:relative md:bg-transparent`}>
          <LeftPanel
            wards={wards}
            complaints={complaints}
            filters={filters}
            setFilter={setFilter}
            onWardClick={handleWardClick}
            selectedWardId={selectedWard?.id}
            onBack={handleBack}
            onDrillDown={handleDrillDown}
          />
        </div>

        {/* Center Canvas: Interactive Map */}
        <div className="flex-1 h-full relative bg-slate-950">
          <LeafletMap
            wards={wards}
            complaints={complaints}
            activeLayers={activeLayers}
            isPickingLocation={isPickingLocation}
            onLocationPicked={handleLocationPicked}
            pickedLocation={pickedLocation}
            center={mapCenter}
            zoom={mapZoom}
            bounds={mapBounds}
            onWardClick={handleWardClick}
            onComplaintClick={handleComplaintClick}
            selectedWardId={selectedWard?.id}
            selectedComplaintId={selectedComplaintId}
            onResetView={handleResetView}
            isDarkMode={isDarkMode}
          />
          {mode === 'ward' && selectedWard && (
            <div className="absolute right-4 top-4 z-[999] w-80 max-h-[75vh] md:max-h-[85vh] bg-[#0F172A]/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl overflow-y-auto no-scrollbar glow-primary flex flex-col">
              <WardDetailPanel
                ward={selectedWard}
                onClose={handleClosePanel}
                onComplaintClick={handleComplaintClick}
              />
            </div>
          )}
        </div>

        {/* Right Side: Details panel slides - Wrapped with responsive overlay rules */}
        <div className={`md:flex ${activeTab === 'ai' ? 'flex absolute inset-0 z-[1002] w-full bg-[#050816]/95 backdrop-blur-md' : 'hidden'} md:relative md:bg-transparent`}>
          <RightPanel
            mode={mode}
            selectedWard={selectedWard}
            selectedComplaintId={selectedComplaintId}
            pickedLocation={pickedLocation}
            isPickingLocation={isPickingLocation}
            setIsPickingLocation={setIsPickingLocation}
            onResetLocation={handleResetLocation}
            refreshMapData={refreshData}
            onFocusCoordinates={handleFocusCoordinates}
            onClosePanel={handleClosePanel}
            onComplaintClick={handleComplaintClick}
            wards={wards}
            complaints={complaints}
            stats={stats}
            filters={filters}
          />
        </div>
      </div>

      {/* Bottom Bar: Horizontal ticker feed - Hidden on mobile to avoid layout crowding */}
      <div className="hidden md:block shrink-0">
        <BottomBar feedEvents={feedEvents} onEventClick={handleEventClick} />
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden flex h-14 w-full bg-[#0F172A]/90 border-t border-white/10 backdrop-blur-lg items-center justify-around z-[1003] shrink-0 select-none pb-safe">
        <button 
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
            activeTab === 'map' ? 'text-[#5B8CFF] text-glow-primary' : 'text-slate-400'
          }`}
        >
          <span className="text-sm">🗺️</span>
          <span>Map HUD</span>
        </button>
        <button 
          onClick={() => setActiveTab('operations')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
            activeTab === 'operations' ? 'text-[#5B8CFF] text-glow-primary' : 'text-slate-400'
          }`}
        >
          <span className="text-sm">📋</span>
          <span>Console</span>
        </button>
        <button 
          onClick={() => setActiveTab('ai')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
            activeTab === 'ai' ? 'text-[#5B8CFF] text-glow-primary' : 'text-slate-400'
          }`}
        >
          <span className="text-sm">🤖</span>
          <span>AI Advisory</span>
        </button>
      </div>
    </div>
  );
};

export default CommandCenter;
