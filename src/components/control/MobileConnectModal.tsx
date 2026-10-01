import React, { useState } from 'react';

interface MobileConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileConnectModal({ isOpen, onClose }: MobileConnectModalProps) {
  const [copiedPanel, setCopiedPanel] = useState(false);
  const [copiedOverlay, setCopiedOverlay] = useState(false);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const panelUrl = currentOrigin || 'https://ais-pre-lwk77fltnudq56kafbgz5k-956692486295.asia-southeast1.run.app';
  const overlayUrl = `${panelUrl}/overlay`;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(
    panelUrl
  )}`;

  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `ITC SPORTS Cricket Scoring Panel Link: ${panelUrl} (PIN: 7860)`
  )}`;

  const copyToClipboard = (text: string, isOverlay: boolean) => {
    navigator.clipboard.writeText(text);
    if (isOverlay) {
      setCopiedOverlay(true);
      setTimeout(() => setCopiedOverlay(false), 2000);
    } else {
      setCopiedPanel(true);
      setTimeout(() => setCopiedPanel(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#080d1a] border-2 border-emerald-500/80 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-lg">
              📱
            </div>
            <div>
              <h3 className="text-lg font-black font-heading text-white">
                MOBILE SCORING & LIVE CONNECT
              </h3>
              <p className="text-[11px] text-emerald-400 font-heading">
                Panel ko mobile par chalane ka aasan tareeqa
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* QR Code and Quick Scan Section */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="bg-white p-2 rounded-xl shadow-lg shrink-0">
              <img
                src={qrCodeUrl}
                alt="Scan to open scoring panel on mobile"
                className="w-36 h-36 object-contain rounded"
              />
            </div>
            <div className="text-center sm:text-left space-y-1.5">
              <span className="inline-block bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-heading font-black px-2 py-0.5 rounded uppercase">
                ⚡ Instant Scan
              </span>
              <h4 className="text-sm font-bold text-white font-heading">
                Mobile Camera se Scan Karein
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Apne mobile ka camera ya koi bhi QR Scanner open karke is code ko scan karein. Panel turant aapke mobile me open ho jayega!
              </p>
            </div>
          </div>

          {/* Direct Link Section */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-heading text-white flex items-center gap-1.5">
                🔗 Mobile Scoring Panel Link:
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">
                PIN: 7860
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={panelUrl}
                className="w-full bg-black/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-emerald-300 font-mono select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(panelUrl, false)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black font-heading text-xs uppercase tracking-wider rounded-lg shrink-0 shadow transition-transform active:scale-95"
              >
                {copiedPanel ? '✓ COPIED' : 'COPY'}
              </button>
            </div>

            {/* WhatsApp Share Button */}
            <div className="pt-1 flex gap-2">
              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-black font-heading text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow"
              >
                <span>💬 WhatsApp par Link Bhejein</span>
              </a>
            </div>
          </div>

          {/* Simple Step-by-Step Instructions in Hindi */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-2 text-xs">
            <h5 className="font-heading font-bold text-emerald-400 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
              <span>📋</span> Mobile me chalane ke 3 Aasan Steps:
            </h5>
            <ol className="space-y-1.5 text-slate-300 list-decimal list-inside pl-1 text-[11px] leading-relaxed">
              <li>
                Upar diye gaye <b>QR Code</b> ko scan karein ya <b>WhatsApp / Chrome browser</b> me link open karein.
              </li>
              <li>
                Mobile screen par Operator PIN maangega — wahan <b>7860</b> (ya apna naya password) daal kar <b>Unlock</b> karein.
              </li>
              <li>
                Ab aap ground par match dekhte hue mobile se <b>0, 1, 2, 4, 6, WIDE, OUT</b> daba kar live scoring kar sakte hain. Computer aur OBS overlay par score bina kisi delay ke automatically update hoga!
              </li>
            </ol>
          </div>

          {/* vMix / OBS Overlay reminder */}
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-3 flex items-center justify-between text-xs">
            <div>
              <span className="text-[11px] text-slate-400 block font-heading">
                vMix / OBS Broadcast Scorebug URL:
              </span>
              <span className="text-[11px] text-emerald-400 font-mono">
                {overlayUrl}
              </span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(overlayUrl, true)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-heading text-[11px] rounded-lg border border-slate-700"
            >
              {copiedOverlay ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-heading font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
