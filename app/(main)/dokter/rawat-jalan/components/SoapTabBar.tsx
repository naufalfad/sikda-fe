import React, { RefObject } from 'react';
import { 
  User, 
  Stethoscope, 
  FileText, 
  Activity, 
  TestTubes, 
  Radio, 
  Syringe, 
  Pill, 
  ClipboardList,
  Clock
} from 'lucide-react';

export interface SoapTabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export const SOAP_TABS: SoapTabItem[] = [
  { id: 'SOAP_S', label: 'S (Subjektif)', icon: <User className="w-4 h-4 mr-2" /> },
  { id: 'SOAP_O', label: 'O (Objektif)', icon: <Stethoscope className="w-4 h-4 mr-2" /> },
  { id: 'SOAP_A', label: 'A (Asesmen & Diagnosa)', icon: <FileText className="w-4 h-4 mr-2" /> },
  { id: 'SOAP_P', label: 'P (Plan)', icon: <Activity className="w-4 h-4 mr-2" /> },
  { id: 'RIWAYAT_RME', label: 'Riwayat RME Pasien', icon: <Clock className="w-4 h-4 mr-2 text-indigo-600" /> },
  { id: 'LABORATORIUM', label: 'Laboratorium', icon: <TestTubes className="w-4 h-4 mr-2 text-amber-500" /> },
  { id: 'RADIOLOGI', label: 'Radiologi', icon: <Radio className="w-4 h-4 mr-2 text-purple-500" /> },
  { id: 'TINDAKAN', label: 'Tindakan Medis (ICD-9)', icon: <Syringe className="w-4 h-4 mr-2 text-blue-500" /> },
  { id: 'RESEP', label: 'Resep Obat', icon: <Pill className="w-4 h-4 mr-2 text-emerald-500" /> },
  { id: 'RUJUKAN', label: 'Rujukan Keluar', icon: <ClipboardList className="w-4 h-4 mr-2 text-indigo-500" /> },
];

interface SoapTabBarProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
}

export default function SoapTabBar({ activeTab, setActiveTab, scrollContainerRef }: SoapTabBarProps) {
  return (
    <div 
      ref={scrollContainerRef}
      className="flex overflow-x-auto border-b border-gray-200 bg-white shadow-sm z-10 w-full scrollbar-hide" 
      style={{ scrollbarWidth: 'none' }}
    >
      {SOAP_TABS.map((tab: SoapTabItem) => (
        <button 
          key={tab.id}
          data-active={activeTab === tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex-shrink-0 flex items-center px-6 py-3.5 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
            activeTab === tab.id 
              ? 'border-blue-600 text-blue-700 bg-blue-50/50' 
              : 'border-transparent text-gray-600 hover:bg-blue-50/30 hover:text-blue-700'
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
