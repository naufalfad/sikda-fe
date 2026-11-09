import React, { RefObject } from 'react';
import { User, Stethoscope, FileText, Activity } from 'lucide-react';

export interface SoapTabItem {
  id: string;
  badge: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  activeColor: string;
  badgeBg: string;
  activeBorder: string;
}

export const SOAP_TABS: SoapTabItem[] = [
  {
    id: 'SOAP_S',
    badge: 'S',
    label: 'Subjektif',
    sublabel: 'Anamnesa & Riwayat Alergi',
    icon: <User className="w-4 h-4" />,
    activeColor: 'text-sky-700 bg-sky-50/70',
    badgeBg: 'bg-sky-600 text-white',
    activeBorder: 'border-sky-600',
  },
  {
    id: 'SOAP_O',
    badge: 'O',
    label: 'Objektif',
    sublabel: 'Fisik, Vital Signs & Foto',
    icon: <Stethoscope className="w-4 h-4" />,
    activeColor: 'text-emerald-700 bg-emerald-50/70',
    badgeBg: 'bg-emerald-600 text-white',
    activeBorder: 'border-emerald-600',
  },
  {
    id: 'SOAP_A',
    badge: 'A',
    label: 'Asesmen',
    sublabel: 'Diagnosa ICD-10 & Klinis',
    icon: <FileText className="w-4 h-4" />,
    activeColor: 'text-amber-800 bg-amber-50/70',
    badgeBg: 'bg-amber-600 text-white',
    activeBorder: 'border-amber-600',
  },
  {
    id: 'SOAP_P',
    badge: 'P',
    label: 'Plan & Tindakan',
    sublabel: 'Terapi, ICD-9, Alkes & BMHP',
    icon: <Activity className="w-4 h-4" />,
    activeColor: 'text-indigo-700 bg-indigo-50/70',
    badgeBg: 'bg-indigo-600 text-white',
    activeBorder: 'border-indigo-600',
  },
];

interface SoapTabBarProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
}

export default function SoapTabBar({ activeTab, setActiveTab, scrollContainerRef }: SoapTabBarProps) {
  return (
    <div 
      ref={scrollContainerRef}
      className="border-b border-slate-200 bg-white shadow-sm z-10 w-full"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
        {SOAP_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              data-active={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-3 px-4 sm:px-6 py-3.5 transition-all text-left focus:outline-none border-b-2 ${
                isActive
                  ? `${tab.activeColor} ${tab.activeBorder} shadow-inner`
                  : 'border-transparent hover:bg-slate-50 text-slate-600 hover:text-slate-900'
              }`}
            >
              {/* Badge Huruf SOAP */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 transition-transform ${
                  isActive
                    ? `${tab.badgeBg} shadow-sm scale-105`
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {tab.badge}
              </div>

              {/* Teks Label & Keterangan */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs sm:text-sm font-extrabold truncate ${
                    isActive ? 'text-slate-900' : 'text-slate-700'
                  }`}>
                    {tab.label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium truncate hidden sm:block">
                  {tab.sublabel}
                </p>
              </div>

              {/* Active Bottom Glow Pip */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-current opacity-80" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
