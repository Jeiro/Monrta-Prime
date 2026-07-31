import React from 'react';

export const renderKeycap = (type: string) => {
  switch (type) {
    case 'MSFT':
      return (
        <div key="msft" className="bg-[#12161F] border border-neutral-800 rounded-xl p-3 flex flex-col justify-center items-center shadow-[inset_0_2px_2px_rgba(255,255,255,0.1),0_4px_0_#06080d,0_8px_15px_rgba(0,0,0,0.85)] h-12 w-16 transform-gpu">
          <span className="text-blue-400 font-bold text-[8px] tracking-wider font-sans leading-none mb-1">MSFT</span>
          <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5">
            <div className="bg-[#F25022] w-1.5 h-1.5"></div>
            <div className="bg-[#7FBA00] w-1.5 h-1.5"></div>
            <div className="bg-[#00A4EF] w-1.5 h-1.5"></div>
            <div className="bg-[#FFB900] w-1.5 h-1.5"></div>
          </div>
        </div>
      );
    case 'CAT':
      return (
        <div key="cat" className="bg-[#12161F] border border-neutral-800 rounded-xl p-3 flex flex-col justify-center items-center shadow-[inset_0_2px_2px_rgba(255,255,255,0.1),0_4px_0_#06080d,0_8px_15px_rgba(0,0,0,0.85)] h-12 w-16 relative overflow-hidden">
          <span className="text-white font-black text-[9px] font-sans relative z-10 leading-none mb-0.5">CAT</span>
          <svg className="w-3.5 h-1.5 relative z-10" viewBox="0 0 20 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 0L20 10H0L10 0Z" fill="#6AA5FF"/>
          </svg>
        </div>
      );
    case 'DIS':
      return (
        <div key="dis" className="bg-[#12161F] border border-neutral-800 rounded-xl p-3 flex flex-col justify-center items-center shadow-[inset_0_2px_2px_rgba(255,255,255,0.1),0_4px_0_#06080d,0_8px_15px_rgba(0,0,0,0.85)] h-12 w-16 text-sky-400">
          <svg className="w-5.5 h-5.5" viewBox="0 0 32 32" fill="currentColor">
            <path d="M10 24c-1.3 0-2.4-.6-3.2-1.7-.8-1.1-.9-2.5-.4-4 .6-1.7 1.8-3.4 3.7-5.1C12 11.5 14.5 9.7 17.5 8c1.2-.7 2.4-1.2 3.5-1.5.8-.2 1.5-.1 2 .2s.7.9.6 1.7c-.1 1.2-.6 2.6-1.5 4.1s-.8 1.9-.3 2.1c.4.1.9-.1 1.4-.6.6-.5 1.1-1.1 1.5-1.9.4-.8.8-1.5 1.1-2h2.2c-.4.9-.9 1.9-1.5 2.9-.6 1-1.2 1.9-1.9 2.5a4 4 0 01-1.4.8c-.5.1-1 0-1.3-.3s-.3-.7-.2-1.3c.1-.8.2-1.6.2-2.3 0-.7-.3-1.1-.9-1.2-.6 0-1.2.3-1.8.8-1.2.9-2.2 2-3 3.4s-1.2 2.7-1.2 4c0 1.5.5 2.2 1.5 2.2 1.3 0 2.8-.9 4.4-2.8 1.6-1.9 2.8-4.2 3.6-6.9.1-.4.3-.8.4-1.2h2c-.3 1.5-.9 3-1.7 4.5s-1.8 2.8-3 3.9c-1.2 1.1-2.4 1.7-3.6 1.7V24z"/>
          </svg>
        </div>
      );
    case 'NFLX':
      return (
        <div key="nflx" className="bg-[#12161F] border border-neutral-800 rounded-xl p-3 flex flex-col justify-center items-center shadow-[inset_0_2px_2px_rgba(255,255,255,0.1),0_4px_0_#06080d,0_8px_15px_rgba(0,0,0,0.85)] h-12 w-16">
          <svg className="w-3.5 h-6.5 filter drop-shadow-sm" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 0h6v28.8L4 36V0z" fill="#E50914" />
            <path d="M14 0h6v36l-6-7.2V0z" fill="#B81D24" />
            <path d="M4 0l16 28.8V36L4 7.2V0z" fill="#E50914" opacity="0.95" />
          </svg>
        </div>
      );
    case 'TWTR':
      return (
        <div key="twtr" className="bg-[#12161F] border border-neutral-800 rounded-xl p-3 flex flex-col justify-center items-center shadow-[inset_0_2px_2px_rgba(255,255,255,0.1),0_4px_0_#06080d,0_8px_15px_rgba(0,0,0,0.85)] h-12 w-16">
          <svg className="w-5 h-5 text-[#1DA1F2]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
          </svg>
        </div>
      );
    case 'GOOG':
      return (
        <div key="goog" className="bg-[#12161F] border border-neutral-800 rounded-xl p-3 flex flex-col justify-center items-center shadow-[inset_0_2px_2px_rgba(255,255,255,0.1),0_4px_0_#06080d,0_8px_15px_rgba(0,0,0,0.85)] h-12 w-16">
          <svg viewBox="0 0 24 24" className="w-4 h-4">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.08H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.92l2.85-2.22.81-.6z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.08l3.66 2.84c.87-2.6 3.3-4.54 6.16-4.54z" fill="#EA4335"/>
          </svg>
        </div>
      );
    case 'AAPL':
      return (
        <div key="aapl" className="bg-white border border-neutral-200 rounded-xl p-3 flex flex-col justify-center items-center shadow-[inset_0_2px_2.5px_white,0_4px_0_#d1d5db,0_15px_25px_rgba(255,255,255,0.65)] h-12 w-16 relative scale-105 z-10 transition-transform">
          <svg viewBox="0 0 24 24" fill="#000" className="w-4.5 h-4.5 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.7-1.13 1.84-.99 2.94.1.08.1.08.1.08.97 0 2.06-.61 2.72-1.41z"/>
          </svg>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-white/10 to-transparent mix-blend-overlay pointer-events-none"></div>
        </div>
      );
    case 'SLACK':
      return (
        <div key="slack" className="bg-[#12161F] border border-neutral-800 rounded-xl p-3 flex flex-col justify-center items-center shadow-[inset_0_2px_2px_rgba(255,255,255,0.1),0_4px_0_#06080d,0_8px_15px_rgba(0,0,0,0.85)] h-12 w-16">
          <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none">
            <path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523 2.528 2.528 0 01-2.522-2.523 2.528 2.528 0 012.522-2.52h2.52v2.52zm1.261 0a2.528 2.528 0 012.52-2.52h5.043a2.528 2.528 0 012.522 2.52v5.043a2.528 2.528 0 01-2.522 2.52H8.823a2.528 2.528 0 01-2.52-2.52v-5.043z" fill="#36C5F0"/>
            <path d="M8.823 5.043a2.528 2.528 0 01-2.52-2.52 2.528 2.528 0 012.52-2.522 2.528 2.528 0 012.522 2.522v2.52h-2.522zm0 1.261a2.528 2.528 0 012.522 2.52v5.042a2.528 2.528 0 01-2.522 2.52H3.78a2.528 2.528 0 01-2.52-2.52V8.824a2.528 2.528 0 012.52-2.52h5.043z" fill="#2EB67D"/>
            <path d="M18.958 8.824a2.528 2.528 0 012.522-2.52 2.528 2.528 0 012.52 2.52 2.528 2.528 0 01-2.52 2.522h-2.522v-2.522zm-1.261 0a2.528 2.528 0 01-2.52 2.522h-5.043a2.528 2.528 0 01-2.522-2.522V3.78a2.528 2.528 0 012.522-2.52h5.043a2.528 2.528 0 012.52 2.52v5.044z" fill="#ECB22E"/>
            <path d="M15.177 18.957a2.528 2.528 0 012.52 2.522 2.528 2.528 0 01-2.52 2.52 2.528 2.528 0 01-2.522-2.52v-2.522h2.522zm0-1.261a2.528 2.528 0 01-2.522-2.52v-5.043a2.528 2.528 0 012.522-2.52H20.22c1.393 0 2.52 1.128 2.52 2.52v5.043c0 1.393-1.127 2.52-2.52 2.52h-5.043z" fill="#E01E5A"/>
          </svg>
        </div>
      );
    case 'CSCO':
      return (
        <div key="csco" className="bg-[#12161F] border border-neutral-800 rounded-xl p-3 flex flex-col justify-center items-center shadow-[inset_0_2px_2px_rgba(255,255,255,0.1),0_4px_0_#06080d,0_8px_15px_rgba(0,0,0,0.85)] h-12 w-16">
          <svg className="w-5 h-4 mb-0.5" viewBox="0 0 24 16" fill="none">
            <rect x="2" y="11" width="1.5" height="3" fill="#00BCEB"/>
            <rect x="5" y="8" width="1.5" height="6" fill="#00BCEB"/>
            <rect x="8" y="5" width="1.5" height="9" fill="#00BCEB"/>
            <rect x="11" y="2" width="1.5" height="12" fill="#00BCEB"/>
            <rect x="14" y="5" width="1.5" height="9" fill="#00BCEB"/>
            <rect x="17" y="8" width="1.5" height="6" fill="#00BCEB"/>
            <rect x="20" y="11" width="1.5" height="3" fill="#00BCEB"/>
          </svg>
          <span className="text-[6.5px] text-[#00BCEB] font-extrabold tracking-widest leading-none uppercase select-none font-sans">CISCO</span>
        </div>
      );
    case 'SBUX':
      return (
        <div key="sbux" className="bg-[#12161F] border border-neutral-800 rounded-xl p-3 flex flex-col justify-center items-center shadow-[inset_0_2px_2px_rgba(255,255,255,0.1),0_4px_0_#06080d,0_8px_15px_rgba(0,0,0,0.85)] h-12 w-16">
          <svg className="w-5 h-5 text-[#006241]" viewBox="0 0 100 100" fill="currentColor">
            <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="4.5"/>
            <circle cx="50" cy="50" r="38" fill="currentColor"/>
            <path d="M50 20l3 9 9.5.5-7 6.5 2 9-7.5-5-7.5 5 2-9-7-6.5 9.5-.5z" fill="white" />
            <path d="M30 40c2 5 8 10 20 10s18-5 20-10l4 25s-14 5-24 5-24-5-24-5l4-25z" fill="white" opacity="0.6" />
          </svg>
        </div>
      );
    case 'TSLA':
      return (
        <div key="tsla" className="bg-[#E82127] border border-red-500 rounded-xl p-3 flex flex-col justify-center items-center shadow-[inset_0_2px_2.5px_rgba(255,100,100,0.5),0_4px_0_#b2161a,0_15px_25px_rgba(232,33,39,0.65)] h-12 w-16 relative scale-105 z-10 transition-transform">
          <svg viewBox="0 0 24 24" fill="#fff" className="w-4.5 h-4.5 filter drop-shadow-sm">
            <path d="M21.3 2c-5.8 2-12.8 2-18.6 0-.2 0-.4.1-.4.3l.5 3c0 .1.2.2.3.2 1.4-.2 2.8-.2 4.2-.1v4.7c-1.3.1-2.6.4-3.8.9-.1 0-.2.2-.2.3c0 .8.1 1.6.3 2.4.1.2.3.3.5.2 1-.3 2.1-.5 3.2-.5v8.1c0 .3.2.5.5.5h3c.3 0 .5-.2.5-.5V13.3c1.1.1 2.1.3 3.1.5.2 0 .4-.1.5-.3.2-.8.3-1.6.3-2.4 0-.1-.1-.3-.2-.3-1.2-.5-2.5-.8-3.8-.9V5.4c1.4-.1 2.8-.1 4.2.1.1 0 .3-.1.3-.2l.5-3c0-.2-.2-.3-.4-.3z"/>
          </svg>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-white/10 to-transparent mix-blend-overlay pointer-events-none"></div>
        </div>
      );
    case 'AMZN':
      return (
        <div key="amzn" className="bg-[#12161F] border border-neutral-800 rounded-xl p-3 flex flex-col justify-center items-center shadow-[inset_0_2px_2px_rgba(255,255,255,0.1),0_4px_0_#06080d,0_8px_15px_rgba(0,0,0,0.85)] h-12 w-16">
          <span className="text-white font-extrabold text-[12px] font-sans leading-none -mb-0.5">a</span>
          <svg viewBox="0 0 24 8" fill="none" className="w-4.5 h-1.5 filter drop-shadow-sm">
            <path d="M2.5 1.5c4.5 3.5 14.5 3.5 19 0" stroke="#FF9900" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M19 1.5l2.5 2.5l2-3" stroke="#FF9900" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      );
    case 'MCD':
      return (
        <div key="mcd" className="bg-[#12161F] border border-neutral-800 rounded-xl p-3 flex flex-col justify-center items-center shadow-[inset_0_2px_2px_rgba(255,255,255,0.1),0_4px_0_#06080d,0_8px_15px_rgba(0,0,0,0.85)] h-12 w-16">
          <svg className="w-4.5 h-4.5 text-[#FFC72C] filter drop-shadow-sm" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2 21h3v-9.5c0-1.93 1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5V21h3v-9.5c0-1.93 1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5V21h3V10.5c0-3.59-2.91-6.5-6.5-6.5-2.06 0-3.89 1.05-5 2.67C9.89 5.05 8.06 4 6 4 2.41 4-.5 6.91-.5 10.5V21h2.5z" />
          </svg>
        </div>
      );
    case 'NVDA':
      return (
        <div key="nvda" className="bg-[#12161F] border border-neutral-800 rounded-xl p-3 flex flex-col justify-center items-center shadow-[inset_0_2px_2px_rgba(255,255,255,0.1),0_4px_0_#06080d,0_8px_15px_rgba(0,0,0,0.85)] h-12 w-16">
          <svg className="w-5.5 h-4.5 text-[#76B900] filter drop-shadow-sm" viewBox="0 0 24 16" fill="currentColor">
            <path d="M18.8 1.4C16.8.5 14.5 0 12 0c-4.1 0-7.7 1.4-10 3.7C.8 5 .1 6.8 0 8.7h2.3c.1-1.3.5-2.4 1.2-3.3C5.1 3.5 8.3 2.3 12 2.3c1.7 0 3.3.3 4.8.8l2-1.7zm1.6 3.1c-1.5-.8-3.3-1.2-5.1-1.2-3.3 0-6.1 1.2-7.8 3.1-1 1.1-1.6 2.4-1.7 3.9H8c.1-1 .5-1.9 1.1-2.5 1.1-1.2 2.8-1.9 4.9-1.9 1 0 1.9.2 2.7.5l2.1-1.8zm1.5 3.3c-.8-.5-1.7-.8-2.7-.8-1.9 0-3.4.8-4.2 1.9-.5.6-.7 1.3-.8 2.1h6L22 7.8z" />
          </svg>
        </div>
      );
    case 'EBAY':
      return (
        <div key="ebay" className="bg-[#12161F] border border-neutral-800 rounded-xl p-3 flex flex-col justify-center items-center shadow-[inset_0_2px_2px_rgba(255,255,255,0.1),0_4px_0_#06080d,0_8px_15px_rgba(0,0,0,0.85)] h-12 w-16">
          <div className="flex items-center space-x-0.2 select-none font-bold" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
            <span className="text-[#E53238] font-bold text-[11px] tracking-tight">e</span>
            <span className="text-[#0064D2] font-semibold text-[11px] tracking-tight -ml-[0.5px]">b</span>
            <span className="text-[#F5AF02] font-semibold text-[12px] tracking-tight -ml-[1px]">a</span>
            <span className="text-[#86B817] font-semibold text-[11px] tracking-tight -ml-[1.2px]">y</span>
          </div>
        </div>
      );
    case 'BIDU':
      return (
        <div key="bidu" className="bg-[#12161F] border border-neutral-800 rounded-xl p-3 flex flex-col justify-center items-center shadow-[inset_0_2px_2px_rgba(255,255,255,0.1),0_4px_0_#06080d,0_8px_15px_rgba(0,0,0,0.85)] h-12 w-16">
          <svg className="w-4.5 h-4.5 text-blue-600 filter drop-shadow-sm" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm6-1c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm-12 0c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm14.5 4c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5 1.5.672 1.5 1.5-.672 1.5-1.5 1.5zm-17 0C2.672 14 2 13.328 2 12.5S2.672 11 3.5 11 5 11.672 5 12.5 4.328 14 3.5 14zm8.5 2c-3.314 0-6 2.686-6 6h12c0-3.314-2.686-6-6-6z"/>
          </svg>
        </div>
      );
    case 'MONETA':
      return (
        <div key="moneta" className="bg-[#12161F] border-2 border-[#6AA5FF]/95 rounded-xl p-2.5 flex flex-col justify-center items-center shadow-[0_4px_0_#2E6BE0,0_15px_22px_rgba(106,165,255,0.55)] h-12 w-16 scale-105 relative z-10 transition-transform">
          <span className="text-accent font-extrabold text-sm leading-none font-sans">M</span>
          <span className="text-[5.5px] text-white/95 font-mono tracking-widest uppercase mt-0.5 leading-none">MONETA</span>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-[#6AA5FF]/15 to-transparent mix-blend-overlay pointer-events-none"></div>
        </div>
      );
    default:
      return null;
  }
};
