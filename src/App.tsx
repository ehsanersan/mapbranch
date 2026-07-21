import React, { useRef, useState, useCallback, useEffect } from 'react';
import L from 'leaflet';
import { useStore } from '@/store/useStore';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import MapView from '@/components/MapView';
import MapControls from '@/components/MapControls';
import AreaPanel from '@/components/AreaPanel';
import BranchForm from '@/components/BranchForm';
import ExportModal from '@/components/ExportModal';
import SettingsPage from '@/components/SettingsPage';
import BranchesPage from '@/components/BranchesPage';
import ToastContainer from '@/components/Toast';
import WelcomeOverlay from '@/components/WelcomeOverlay';
import type { Branch } from '@/types';

export default function App() {
  const mapRef = useRef<L.Map | null>(null);
  
  const branches = useStore((s) => s.branches);
  const selectedBranchId = useStore((s) => s.selectedBranchId);
  const drawingState = useStore((s) => s.drawingState);
  const currentPage = useStore((s) => s.currentPage);
  const selectBranch = useStore((s) => s.selectBranch);
  const addBranch = useStore((s) => s.addBranch);
  const updateBranch = useStore((s) => s.updateBranch);
  const setDrawingMode = useStore((s) => s.setDrawingMode);
  const setCurrentPage = useStore((s) => s.setCurrentPage);

  const [branchFormOpen, setBranchFormOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [clickedCoords, setClickedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(() => {
    const stored = localStorage.getItem('mapbranch-storage');
    if (!stored) return true;
    try {
      const data = JSON.parse(stored);
      return !data.state?.branches?.length;
    } catch {
      return true;
    }
  });

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (drawingState.mode === 'placing-branch') {
      setClickedCoords({ lat, lng });
      setBranchFormOpen(true);
      setDrawingMode({ mode: 'none', currentPoints: [] });
    }
  }, [drawingState.mode, setDrawingMode]);

  const handleAddBranch = useCallback(() => {
    setEditingBranch(null);
    setClickedCoords(null);
    setDrawingMode({ mode: 'placing-branch', currentPoints: [] });
    useStore.getState().addToast('روی نقشه کلیک کنید', 'info');
  }, [setDrawingMode]);

  const handleAddBranchDirect = useCallback(() => {
    setEditingBranch(null);
    setClickedCoords(null);
    setBranchFormOpen(true);
  }, []);

  const handleEditBranch = useCallback((id: string) => {
    const branch = branches.find((b) => b.id === id);
    if (branch) {
      setEditingBranch(branch);
      setBranchFormOpen(true);
    }
  }, [branches]);

  const handleSaveBranch = useCallback((data: Omit<Branch, 'id' | 'areas' | 'createdAt' | 'updatedAt'>) => {
    if (editingBranch) {
      updateBranch(editingBranch.id, data);
    } else {
      addBranch(data);
      setTimeout(() => {
        mapRef.current?.flyTo([data.latitude, data.longitude], 14, { duration: 0.8 });
      }, 100);
    }
    setEditingBranch(null);
    setClickedCoords(null);
  }, [editingBranch, addBranch, updateBranch]);

  const handleZoomToBranch = useCallback((id: string) => {
    const branch = branches.find((b) => b.id === id);
    if (branch && mapRef.current) {
      selectBranch(id);
      
      if (branch.areas.length > 0) {
        const group = L.featureGroup();
        group.addLayer(L.marker([branch.latitude, branch.longitude]));
        branch.areas.forEach((a) => {
          if (a.points.length >= 3) {
            group.addLayer(L.polygon(a.points.map((p) => [p.latitude, p.longitude] as [number, number])));
          }
        });
        mapRef.current.flyToBounds(group.getBounds().pad(0.2), { duration: 0.8 });
      } else {
        mapRef.current.flyTo([branch.latitude, branch.longitude], 15, { duration: 0.8 });
      }
    }
  }, [branches, selectBranch]);

  const handleZoomToAll = useCallback(() => {
    if (!mapRef.current || branches.length === 0) return;
    const group = L.featureGroup();
    branches.forEach((b) => {
      group.addLayer(L.marker([b.latitude, b.longitude]));
      b.areas.forEach((a) => {
        if (a.points.length >= 3) {
          group.addLayer(L.polygon(a.points.map((p) => [p.latitude, p.longitude] as [number, number])));
        }
      });
    });
    mapRef.current.flyToBounds(group.getBounds().pad(0.15), { duration: 0.8 });
  }, [branches]);

  const handleStartDrawing = useCallback((branchId: string, slotIndex: number) => {
    selectBranch(branchId);
    setDrawingMode({
      mode: 'drawing-polygon',
      currentPoints: [],
      targetBranchId: branchId,
      targetSlotIndex: slotIndex,
    });
    setCurrentPage('dashboard');
    useStore.getState().addToast('روی نقشه کلیک کنید تا نقاط محدوده را مشخص کنید', 'info');
  }, [selectBranch, setDrawingMode, setCurrentPage]);

  const selectedBranch = branches.find((b) => b.id === selectedBranchId);

  return (
    <div className="w-full h-full bg-bg-dark relative overflow-hidden">
      <Header />

      {/* Settings page */}
      {currentPage === 'settings' && <SettingsPage />}

      {/* Branches page */}
      {currentPage === 'branches' && (
        <BranchesPage
          onEditBranch={handleEditBranch}
          onZoomToBranch={handleZoomToBranch}
        />
      )}

      {/* Dashboard */}
      {currentPage === 'dashboard' && (
        <>
          <Sidebar
            onAddBranch={handleAddBranch}
            onEditBranch={handleEditBranch}
            onZoomToBranch={handleZoomToBranch}
            onZoomToAll={handleZoomToAll}
          />

          <main className="fixed top-16 left-0 right-0 lg:right-80 bottom-0 z-[100]">
            <MapView onMapClick={handleMapClick} mapRef={mapRef} />
            <MapControls mapRef={mapRef} />

            {/* FAB buttons */}
            <div className="absolute bottom-6 right-6 z-[500] flex flex-col gap-3">
              <button
                onClick={() => setExportOpen(true)}
                className="w-12 h-12 rounded-2xl glass flex items-center justify-center text-xl hover:bg-white/10 transition-all shadow-xl"
                title="خروجی"
              >
                📤
              </button>
              <button
                onClick={handleAddBranchDirect}
                className="w-12 h-12 rounded-2xl btn-primary flex items-center justify-center text-xl shadow-xl relative z-10"
                title="شعبه جدید"
              >
                <span className="relative z-10">+</span>
              </button>
            </div>
          </main>

          {/* Area Panel */}
          {selectedBranchId && selectedBranch && (
            <AreaPanel onStartDrawing={handleStartDrawing} />
          )}
        </>
      )}

      {/* Branch form */}
      <BranchForm
        isOpen={branchFormOpen}
        onClose={() => { setBranchFormOpen(false); setEditingBranch(null); setClickedCoords(null); }}
        onSave={handleSaveBranch}
        initialData={editingBranch}
        initialCoords={clickedCoords}
      />

      {/* Export modal */}
      <ExportModal isOpen={exportOpen} onClose={() => setExportOpen(false)} />

      {/* Toast */}
      <ToastContainer />

      {/* Welcome */}
      {showWelcome && <WelcomeOverlay onClose={() => setShowWelcome(false)} />}
    </div>
  );
}
