import { create } from 'zustand';
import { FaskesItem } from '@/services/dinkes.service';

export interface PanelItem {
  id: string;
  type: 'layers' | 'katalog-faskes' | 'detil-faskes' | 'basemap-gallery' | 'statistik' | 'tentang';
  title: string;
  isVisible: boolean;
  data?: any;
}

interface GisUIState {
  // Panel management
  activePanels: PanelItem[];
  openPanel: (type: PanelItem['type'], title: string, data?: any) => void;
  closePanel: (id: string) => void;
  closePanelsToTheRight: (index: number) => void;
  clearPanels: () => void;

  // Spatial layers and map state
  activeLayers: string[];
  toggleLayer: (layerId: string) => void;
  setAllLayers: (layers: string[]) => void;

  mapOpacity: number;
  setMapOpacity: (opacity: number) => void;
  maskOpacity: number;
  setMaskOpacity: (opacity: number) => void;

  activeBaseMap: 'dark' | 'esri' | 'osm' | 'satellite' | 'street';
  setActiveBaseMap: (basemap: 'dark' | 'esri' | 'osm' | 'satellite' | 'street') => void;

  selectedFaskesId: string | null;
  selectedFaskes: FaskesItem | null;
  setSelectedFaskes: (faskes: FaskesItem | null) => void;

  mapCenter: [number, number];
  setMapCenter: (center: [number, number]) => void;
  mapZoom: number;
  setMapZoom: (zoom: number) => void;

  activeAdminBoundary: 'none' | 'kecamatan';
  setActiveAdminBoundary: (boundary: 'none' | 'kecamatan') => void;
  showImpactRadius: boolean;
  setShowImpactRadius: (show: boolean) => void;

  // Filters & Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedSubdistrict: string;
  setSelectedSubdistrict: (kec: string) => void;
  selectedAmbulanceType: string;
  setSelectedAmbulanceType: (amb: string) => void;

  resetMapContext: () => void;
}

export const useGisUIStore = create<GisUIState>((set) => ({
  // Panels
  activePanels: [],

  openPanel: (type, title, data = null) =>
    set((state) => {
      const isFloating = type === 'detil-faskes';
      let nextPanels = [...state.activePanels];

      const isLeftMenu =
        type === 'layers' ||
        type === 'katalog-faskes' ||
        type === 'basemap-gallery' ||
        type === 'statistik' ||
        type === 'tentang';

      if (isLeftMenu) {
        nextPanels = nextPanels.filter((p) => p.type !== 'detil-faskes');
        nextPanels = nextPanels.filter((p) => p.type !== type);
      } else if (isFloating) {
        nextPanels = nextPanels.filter((p) => p.type !== 'detil-faskes');
      }

      const newPanel: PanelItem = {
        id: `${type}-${Date.now()}`,
        type,
        title,
        isVisible: true,
        data,
      };

      nextPanels.push(newPanel);
      return { activePanels: nextPanels };
    }),

  closePanel: (id) =>
    set((state) => {
      const closedPanel = state.activePanels.find((p) => p.id === id);
      if (!closedPanel) return {};

      const filtered = state.activePanels.filter((p) => p.id !== id);
      const isDetail = closedPanel.type === 'detil-faskes';

      return {
        activePanels: filtered,
        ...(isDetail && {
          selectedFaskesId: null,
          selectedFaskes: null,
          showImpactRadius: false,
        }),
      };
    }),

  closePanelsToTheRight: (index) =>
    set((state) => {
      const sliced = state.activePanels.slice(0, index + 1);
      const isDetailStillOpen = sliced.some((p) => p.type === 'detil-faskes');

      return {
        activePanels: sliced,
        ...(!isDetailStillOpen && {
          selectedFaskesId: null,
          selectedFaskes: null,
          showImpactRadius: false,
        }),
      };
    }),

  clearPanels: () =>
    set({
      activePanels: [],
      selectedFaskesId: null,
      selectedFaskes: null,
      showImpactRadius: false,
    }),

  // Layers & Map Settings
  activeLayers: [
    'layer-rs',
    'layer-puskesmas',
    'layer-pustu',
    'layer-posyandu',
    'layer-poslansia',
    'layer-lab',
    'layer-apotek',
    'layer-amb-pasien',
    'layer-amb-jenazah',
  ],

  toggleLayer: (layerId) =>
    set((state) => {
      const exists = state.activeLayers.includes(layerId);
      const next = exists
        ? state.activeLayers.filter((id) => id !== layerId)
        : [...state.activeLayers, layerId];
      return { activeLayers: next };
    }),

  setAllLayers: (layers) => set({ activeLayers: layers }),

  mapOpacity: 85,
  setMapOpacity: (opacity) => set({ mapOpacity: opacity }),
  maskOpacity: 55,
  setMaskOpacity: (opacity) => set({ maskOpacity: opacity }),

  activeBaseMap: 'dark',
  setActiveBaseMap: (basemap) => set({ activeBaseMap: basemap }),

  selectedFaskesId: null,
  selectedFaskes: null,
  setSelectedFaskes: (faskes) =>
    set({
      selectedFaskes: faskes,
      selectedFaskesId: faskes?.id || null,
    }),

  mapCenter: [-6.4889, 106.8432], // Cibinong Kab. Bogor
  setMapCenter: (center) => set({ mapCenter: center }),
  mapZoom: 12,
  setMapZoom: (zoom) => set({ mapZoom: zoom }),

  activeAdminBoundary: 'none',
  setActiveAdminBoundary: (boundary) => set({ activeAdminBoundary: boundary }),
  showImpactRadius: false,
  setShowImpactRadius: (show) => set({ showImpactRadius: show }),

  // Filters
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  selectedCategory: 'ALL',
  setSelectedCategory: (cat) => set({ selectedCategory: cat }),
  selectedSubdistrict: 'ALL',
  setSelectedSubdistrict: (kec) => set({ selectedSubdistrict: kec }),
  selectedAmbulanceType: 'ALL',
  setSelectedAmbulanceType: (amb) => set({ selectedAmbulanceType: amb }),

  resetMapContext: () =>
    set({
      activeLayers: [
        'layer-rs',
        'layer-puskesmas',
        'layer-pustu',
        'layer-posyandu',
        'layer-poslansia',
        'layer-lab',
        'layer-apotek',
        'layer-amb-pasien',
        'layer-amb-jenazah',
      ],
      selectedFaskesId: null,
      selectedFaskes: null,
      activePanels: [],
      activeAdminBoundary: 'none',
      showImpactRadius: false,
      mapOpacity: 85,
      maskOpacity: 55,
      activeBaseMap: 'dark',
      mapCenter: [-6.4889, 106.8432],
      mapZoom: 12,
      searchQuery: '',
      selectedCategory: 'ALL',
      selectedSubdistrict: 'ALL',
      selectedAmbulanceType: 'ALL',
    }),
}));
