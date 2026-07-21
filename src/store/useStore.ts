import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Branch, Area, PointCoord, DrawingState, MapSettings, Toast, AppState } from '@/types';

const defaultMapSettings: MapSettings = {
  mapType: 'street',
  showBranches: true,
  showAllAreas: true,
  showArea1: true,
  showArea2: true,
  showArea3: true,
  showBranchNames: true,
  showStickers: true,
  showPolygonPoints: false,
  showBorderLines: true,
  coordinateFormat: 'lat-lng',
  coordinateStyle: 'decimal',
  distanceUnit: 'metric',
};

const defaultDrawingState: DrawingState = {
  mode: 'none',
  currentPoints: [],
};

interface StoreActions {
  addBranch: (branch: Omit<Branch, 'id' | 'areas' | 'createdAt' | 'updatedAt'>) => string;
  updateBranch: (id: string, updates: Partial<Branch>) => void;
  deleteBranch: (id: string) => void;
  selectBranch: (id: string | null) => void;
  
  addArea: (branchId: string, slotIndex: number, points: PointCoord[], name?: string) => void;
  updateArea: (branchId: string, areaId: string, updates: Partial<Area>) => void;
  deleteArea: (branchId: string, areaId: string) => void;
  selectArea: (id: string | null) => void;
  
  setDrawingMode: (state: DrawingState) => void;
  addDrawingPoint: (point: PointCoord) => void;
  removeLastDrawingPoint: () => void;
  finishDrawing: () => void;
  cancelDrawing: () => void;
  
  updateMapSettings: (updates: Partial<MapSettings>) => void;
  
  setSidebarOpen: (open: boolean) => void;
  setCurrentPage: (page: AppState['currentPage']) => void;
  
  addToast: (message: string, type: Toast['type'], duration?: number) => void;
  removeToast: (id: string) => void;
  
  saveData: () => void;
  importData: (data: Branch[]) => void;
  exportData: () => Branch[];
  clearAllData: () => void;
  
  pushUndo: () => void;
  undo: () => void;
  redo: () => void;
}

type Store = AppState & StoreActions;

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      branches: [],
      selectedBranchId: null,
      selectedAreaId: null,
      drawingState: defaultDrawingState,
      mapSettings: defaultMapSettings,
      sidebarOpen: true,
      currentPage: 'dashboard',
      toasts: [],
      lastSaved: null,
      hasUnsavedChanges: false,
      undoStack: [],
      redoStack: [],

      addBranch: (branchData) => {
        const id = uuidv4();
        const now = new Date().toISOString();
        const newBranch: Branch = {
          ...branchData,
          id,
          areas: [],
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          branches: [...state.branches, newBranch],
          selectedBranchId: id,
          lastSaved: now,
        }));
        get().addToast('شعبه با موفقیت ایجاد شد', 'success');
        return id;
      },

      updateBranch: (id, updates) => {
        get().pushUndo();
        const now = new Date().toISOString();
        set((state) => ({
          branches: state.branches.map((b) =>
            b.id === id ? { ...b, ...updates, updatedAt: now } : b
          ),
          lastSaved: now,
        }));
      },

      deleteBranch: (id) => {
        get().pushUndo();
        const now = new Date().toISOString();
        set((state) => ({
          branches: state.branches.filter((b) => b.id !== id),
          selectedBranchId: state.selectedBranchId === id ? null : state.selectedBranchId,
          lastSaved: now,
        }));
        get().addToast('شعبه حذف شد', 'success');
      },

      selectBranch: (id) => set({ selectedBranchId: id, selectedAreaId: null }),

      addArea: (branchId, slotIndex, points, name) => {
        get().pushUndo();
        const areaId = uuidv4();
        const now = new Date().toISOString();
        const colors = ['#7C3AED', '#FBBF24', '#10B981'];
        const newArea: Area = {
          id: areaId,
          branchId,
          name: name || `محدوده ${slotIndex + 1}`,
          slotIndex,
          points,
          fillColor: colors[slotIndex] || '#7C3AED',
          fillOpacity: 0.25,
          borderColor: colors[slotIndex] || '#7C3AED',
          borderOpacity: 0.9,
          borderWidth: 3,
          borderStyle: 'solid',
          visible: true,
          locked: false,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          branches: state.branches.map((b) =>
            b.id === branchId ? { ...b, areas: [...b.areas, newArea], updatedAt: now } : b
          ),
          selectedAreaId: areaId,
          lastSaved: now,
        }));
        get().addToast('محدوده با موفقیت ایجاد شد', 'success');
      },

      updateArea: (branchId, areaId, updates) => {
        const now = new Date().toISOString();
        set((state) => ({
          branches: state.branches.map((b) =>
            b.id === branchId
              ? {
                  ...b,
                  areas: b.areas.map((a) =>
                    a.id === areaId ? { ...a, ...updates, updatedAt: now } : a
                  ),
                  updatedAt: now,
                }
              : b
          ),
          lastSaved: now,
        }));
      },

      deleteArea: (branchId, areaId) => {
        get().pushUndo();
        const now = new Date().toISOString();
        set((state) => ({
          branches: state.branches.map((b) =>
            b.id === branchId
              ? { ...b, areas: b.areas.filter((a) => a.id !== areaId), updatedAt: now }
              : b
          ),
          selectedAreaId: state.selectedAreaId === areaId ? null : state.selectedAreaId,
          lastSaved: now,
        }));
        get().addToast('محدوده حذف شد', 'success');
      },

      selectArea: (id) => set({ selectedAreaId: id }),

      setDrawingMode: (drawingState) => set({ drawingState }),

      addDrawingPoint: (point) => {
        set((state) => ({
          drawingState: {
            ...state.drawingState,
            currentPoints: [...state.drawingState.currentPoints, point],
          },
        }));
      },

      removeLastDrawingPoint: () => {
        set((state) => ({
          drawingState: {
            ...state.drawingState,
            currentPoints: state.drawingState.currentPoints.slice(0, -1),
          },
        }));
      },

      finishDrawing: () => {
        const state = get();
        const { drawingState } = state;
        if (drawingState.mode === 'drawing-polygon' && drawingState.currentPoints.length >= 3) {
          if (drawingState.targetBranchId !== undefined && drawingState.targetSlotIndex !== undefined) {
            state.addArea(drawingState.targetBranchId, drawingState.targetSlotIndex, drawingState.currentPoints);
          }
        }
        set({ drawingState: defaultDrawingState });
      },

      cancelDrawing: () => {
        set({ drawingState: defaultDrawingState });
        get().addToast('رسم لغو شد', 'info');
      },

      updateMapSettings: (updates) => {
        set((state) => ({
          mapSettings: { ...state.mapSettings, ...updates },
        }));
      },

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setCurrentPage: (page) => set({ currentPage: page }),

      addToast: (message, type, duration = 3500) => {
        const id = uuidv4();
        set((state) => ({
          toasts: [...state.toasts, { id, message, type, duration }],
        }));
        if (duration > 0) {
          setTimeout(() => get().removeToast(id), duration);
        }
      },

      removeToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      },

      saveData: () => {
        set({ lastSaved: new Date().toISOString() });
        get().addToast('ذخیره شد', 'success');
      },

      importData: (data) => {
        get().pushUndo();
        set({
          branches: data,
          lastSaved: new Date().toISOString(),
        });
        get().addToast(`${data.length} شعبه وارد شد`, 'success');
      },

      exportData: () => get().branches,

      clearAllData: () => {
        get().pushUndo();
        set({
          branches: [],
          selectedBranchId: null,
          selectedAreaId: null,
          lastSaved: new Date().toISOString(),
        });
        get().addToast('همه داده‌ها پاک شد', 'info');
      },

      pushUndo: () => {
        set((state) => ({
          undoStack: [...state.undoStack.slice(-19), JSON.parse(JSON.stringify(state.branches))],
          redoStack: [],
        }));
      },

      undo: () => {
        const { undoStack, branches } = get();
        if (undoStack.length === 0) return;
        const prev = undoStack[undoStack.length - 1];
        set((state) => ({
          undoStack: state.undoStack.slice(0, -1),
          redoStack: [...state.redoStack, JSON.parse(JSON.stringify(branches))],
          branches: prev,
        }));
        get().addToast('بازگشت انجام شد', 'info');
      },

      redo: () => {
        const { redoStack, branches } = get();
        if (redoStack.length === 0) return;
        const next = redoStack[redoStack.length - 1];
        set((state) => ({
          redoStack: state.redoStack.slice(0, -1),
          undoStack: [...state.undoStack, JSON.parse(JSON.stringify(branches))],
          branches: next,
        }));
        get().addToast('تکرار انجام شد', 'info');
      },
    }),
    {
      name: 'mapbranch-storage',
      partialize: (state) => ({
        branches: state.branches,
        mapSettings: state.mapSettings,
        lastSaved: state.lastSaved,
      }),
    }
  )
);
