export interface PointCoord {
  latitude: number;
  longitude: number;
}

export interface Area {
  id: string;
  branchId: string;
  name: string;
  description?: string;
  slotIndex: number; // 0, 1, or 2
  points: PointCoord[];
  fillColor: string;
  fillOpacity: number;
  borderColor: string;
  borderOpacity: number;
  borderWidth: number;
  borderStyle: 'solid' | 'dashed' | 'dotted';
  visible: boolean;
  locked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  link?: string;
  latitude: number;
  longitude: number;
  sticker: string;
  stickerType: 'emoji' | 'icon' | 'image';
  color: string;
  status: 'active' | 'inactive' | 'pending';
  areas: Area[];
  createdAt: string;
  updatedAt: string;
}

export type DrawingMode = 'none' | 'placing-branch' | 'drawing-polygon';

export interface DrawingState {
  mode: DrawingMode;
  currentPoints: PointCoord[];
  targetBranchId?: string;
  targetSlotIndex?: number;
}

export interface MapSettings {
  mapType: 'street' | 'satellite' | 'dark';
  showBranches: boolean;
  showAllAreas: boolean;
  showArea1: boolean;
  showArea2: boolean;
  showArea3: boolean;
  showBranchNames: boolean;
  showStickers: boolean;
  showPolygonPoints: boolean;
  showBorderLines: boolean;
  coordinateFormat: 'lat-lng' | 'lng-lat';
  coordinateStyle: 'decimal' | 'dms';
  distanceUnit: 'metric' | 'imperial';
}

export interface ExportSettings {
  format: 'png' | 'jpeg' | 'webp';
  resolution: 1 | 2 | 3 | 4;
  aspectRatio: 'current' | 'square' | 'landscape' | 'portrait';
  quality: number;
  showBranchName: boolean;
  showStickers: boolean;
  showAreas: boolean;
  showPolygonPoints: boolean;
  showLegend: boolean;
  showScale: boolean;
  showCompass: boolean;
  showDate: boolean;
  showLogo: boolean;
  background: 'transparent' | 'white' | 'dark' | 'custom';
  customBgColor: string;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export interface AppState {
  branches: Branch[];
  selectedBranchId: string | null;
  selectedAreaId: string | null;
  drawingState: DrawingState;
  mapSettings: MapSettings;
  sidebarOpen: boolean;
  currentPage: 'dashboard' | 'branches' | 'branch-detail' | 'settings';
  toasts: Toast[];
  lastSaved: string | null;
  hasUnsavedChanges: boolean;
  undoStack: Branch[][];
  redoStack: Branch[][];
}
