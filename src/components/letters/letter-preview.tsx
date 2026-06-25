"use client";

import React, { useState, useEffect, useRef } from "react";
import { formatDate } from "@/lib/utils";
import { ZoomIn, ZoomOut, Maximize, ChevronLeft, ChevronRight } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface LetterPreviewProps {
  subject: string;
  body: string;
  recipientName: string;
  recipientDesignation: string;
  recipientAddress: string;
  letterDate: string;
  referenceNo: string;
  department: string;
  signatureUrl?: string;
}

export function LetterPreview({
  subject,
  body,
  recipientName,
  recipientDesignation,
  recipientAddress,
  letterDate,
  referenceNo,
  department,
  signatureUrl,
}: LetterPreviewProps) {
  const [pages, setPages] = useState<string[]>([""]);
  const [isSmartFit, setIsSmartFit] = useState(false);
  const measurerRef = useRef<HTMLDivElement>(null);

  // A4 dimensions in pixels at 96 DPI
  // 210mm x 297mm -> ~794px x 1123px
  const PAGE_HEIGHT_PX = 1123;
  const PAGE_WIDTH_PX = 794;
  
  // Constants for pagination (approximate conversion: 1mm = 3.78px)
  const P1_RESERVED_PX = 430; // ~115mm (Header, Ref, Date, Dept, Recipient, Subject, Salutation)
  const PN_RESERVED_PX = 120; // ~32mm (Subsequent page headers)
  const FOOTER_RESERVE_PX = 100; // ~26mm (Footer region)
  
  const BODY_MAX_HEIGHT_P1 = PAGE_HEIGHT_PX - P1_RESERVED_PX - FOOTER_RESERVE_PX;
  const BODY_MAX_HEIGHT_PN = PAGE_HEIGHT_PX - PN_RESERVED_PX - FOOTER_RESERVE_PX;
  const SMART_FIT_THRESHOLD = 90; // ~25mm or ~4 lines

  useEffect(() => {
    if (!measurerRef.current) return;

    // 1. Prepare elements to measure
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = body || "";
    const elements = Array.from(tempDiv.children);

    if (elements.length === 0 && body) {
      const p = document.createElement("p");
      p.innerText = body;
      elements.push(p);
    }

    // 2. Measure total height with standard font to check for Smart Fit
    const measureBox = measurerRef.current;
    measureBox.innerHTML = body || "";
    const totalHeight = measureBox.scrollHeight;

    // 3. Determine if Smart Fit should be active
    const willSmartFit = totalHeight > BODY_MAX_HEIGHT_P1 && totalHeight <= BODY_MAX_HEIGHT_P1 + SMART_FIT_THRESHOLD;
    setIsSmartFit(willSmartFit);

    // 4. Split into pages
    const newPages: string[] = [];
    let currentPageHtml = "";
    let isP1 = true;
    
    // Adjust limits based on smart fit
    const p1Limit = willSmartFit ? BODY_MAX_HEIGHT_P1 + SMART_FIT_THRESHOLD : BODY_MAX_HEIGHT_P1;
    const otherLimit = BODY_MAX_HEIGHT_PN;

    // Update measureBox styles if smart fit is active for better estimation
    measureBox.style.fontSize = willSmartFit ? '10pt' : '11pt';
    measureBox.style.lineHeight = willSmartFit ? '1.5' : '1.7';
    measureBox.innerHTML = "";

    for (const el of elements) {
      const outerHtml = el.outerHTML;
      measureBox.innerHTML += outerHtml;
      
      const maxHeight = isP1 ? p1Limit : otherLimit;
      
      if (measureBox.scrollHeight > maxHeight && currentPageHtml !== "") {
        newPages.push(currentPageHtml);
        currentPageHtml = outerHtml;
        measureBox.innerHTML = outerHtml;
        isP1 = false;
      } else {
        currentPageHtml += outerHtml;
      }
    }
    
    if (currentPageHtml) {
      newPages.push(currentPageHtml);
    }

    setPages(newPages.length > 0 ? newPages : [""]);
  }, [body]);

  return (
    <div className="relative bg-gray-200/80 rounded-lg overflow-hidden h-[calc(100vh-200px)] border border-gray-300">
      {/* Hidden measurer for accurate splitting */}
      <div 
        ref={measurerRef}
        className="absolute opacity-0 pointer-events-none"
        style={{ 
          width: '160mm', 
          fontSize: '11pt', 
          lineHeight: '1.6', 
          fontFamily: "'Inter', serif",
          padding: '0 5mm' 
        }}
      />

      <TransformWrapper
        initialScale={0.75}
        minScale={0.2}
        maxScale={2.5}
        centerOnInit={true}
        wheel={{ step: 0.1 }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div className="absolute top-6 right-6 z-20 flex gap-2 shadow-2xl bg-white/95 backdrop-blur-md p-2 rounded-xl border border-gray-200">
              <button 
                type="button" 
                onClick={() => zoomIn()} 
                className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-gray-700 transition-all duration-200 active:scale-90" 
                title="Zoom In"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button 
                type="button" 
                onClick={() => zoomOut()} 
                className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-gray-700 transition-all duration-200 active:scale-90" 
                title="Zoom Out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <div className="w-[1px] bg-gray-200 my-1 mx-1"></div>
              <button 
                type="button" 
                onClick={() => resetTransform()} 
                className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-gray-700 transition-all duration-200" 
                title="Fit to Screen"
              >
                <Maximize className="w-5 h-5" />
              </button>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3 w-full max-w-xs">
              {isSmartFit ? (
                <div className="bg-blue-600 text-white border border-blue-500 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-500/20 animate-in fade-in slide-in-from-bottom-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-100 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-100"></span>
                  </span>
                  Smart Fit Active: Auto-Shrunk to 1 Page
                </div>
              ) : pages.length > 1 && (
                <div className="bg-gray-900/90 text-white backdrop-blur-md px-5 py-2 rounded-full shadow-2xl border border-white/10 flex items-center gap-3 text-xs font-medium animate-in fade-in slide-in-from-bottom-2">
                  <div className="bg-blue-500 p-1 rounded-md">
                    <Maximize className="w-3 h-3" />
                  </div>
                  <span>Multi-page Document ({pages.length} Pages)</span>
                </div>
              )}
            </div>
            
            <TransformComponent 
              wrapperClass="!w-full !h-full !cursor-move" 
              contentClass="flex flex-col items-center py-20 px-10"
            >
              <div className="flex flex-col items-center gap-12 min-w-max">
                {pages.map((pageContent, idx) => (
                  <div 
                    key={idx}
                    className="bg-white shadow-[0_0_20px_rgba(0,0,0,0.15)] flex-shrink-0 relative overflow-hidden"
                    style={{ 
                      width: '210mm', 
                      height: '297mm', // Fixed height to strictly match A4
                      padding: '20mm 25mm 25mm 25mm',
                      fontFamily: "'Inter', 'Noto Sans Kannada', serif",
                      fontSize: isSmartFit ? "10pt" : "11pt",
                      lineHeight: isSmartFit ? "1.4" : "1.6",
                    }}
                  >
                    {/* Header - Only on Page 1 */}
                    {idx === 0 ? (
                      <div className="text-center border-b-2 border-blue-900 pb-4 mb-6">
                        <div className="flex items-center justify-center mb-1">
                          <div className="w-12 h-12 rounded-full bg-blue-900 flex items-center justify-center text-white font-bold text-lg mr-3">
                            MP
                          </div>
                          <div className="text-left">
                            <p className="text-[10px] tracking-[0.3em] text-gray-400 uppercase font-semibold">
                              Member of Parliament
                            </p>
                            <h1 className="text-xl font-bold text-blue-900 tracking-tight">
                              OFFICE OF THE HON&apos;BLE MEMBER OF PARLIAMENT
                            </h1>
                            <p className="text-xs text-gray-500">
                              Lok Sabha  &bull;  Constituency Name, Karnataka
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center text-[10px] text-gray-400 border-b border-gray-100 pb-2 mb-6 uppercase tracking-widest font-semibold">
                        <span>Office of the Hon&apos;ble Member of Parliament</span>
                        <span>Ref: {referenceNo || "MP/---"}</span>
                      </div>
                    )}

                    {/* Ref & Date - Page 1 */}
                    {idx === 0 && (
                      <div className="flex justify-between items-start mb-6 text-sm">
                        <div>
                          <p className="text-gray-400 text-[10px] uppercase tracking-wider font-bold">Ref No.</p>
                          <p className="font-mono font-medium text-gray-800">{referenceNo || "MP/____/____"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-400 text-[10px] uppercase tracking-wider font-bold">Date</p>
                          <p className="font-medium text-gray-800">{letterDate ? formatDate(letterDate, "long") : "_______________"}</p>
                        </div>
                      </div>
                    )}

                    {/* Department - Page 1 */}
                    {idx === 0 && department && (
                      <div className="mb-6">
                        <p className="text-gray-400 text-[10px] uppercase tracking-wider font-bold">Department</p>
                        <p className="font-medium text-gray-800 border-l-2 border-blue-900/10 pl-2">{department}</p>
                      </div>
                    )}

                    {/* Recipient - Page 1 */}
                    {idx === 0 && (
                      <div className="mb-6 text-[11pt]">
                        <p className="font-medium">To,</p>
                        <div className="mt-1">
                          <p className="font-bold text-lg text-gray-900">{recipientName || "________________"}</p>
                          {recipientDesignation && <p className="text-gray-700">{recipientDesignation}</p>}
                          {recipientAddress && <p className="text-gray-600 max-w-[70%] text-sm mt-1">{recipientAddress}</p>}
                        </div>
                      </div>
                    )}

                    {/* Subject - Page 1 */}
                    {idx === 0 && (
                      <div className="mb-6">
                        <p>
                          <span className="font-bold">Subject: </span>
                          <span className="underline decoration-1 underline-offset-4 font-medium italic">
                            {subject || "________________________________________"}
                          </span>
                        </p>
                      </div>
                    )}

                    {/* Salutation - Page 1 */}
                    {idx === 0 && <p className="mb-4">Respected Sir/Madam,</p>}

                    {/* Page Body Content */}
                    <div
                      className="text-justify body-content-preview"
                      style={{ 
                        fontSize: isSmartFit ? "10pt" : "11pt",
                        lineHeight: isSmartFit ? "1.5" : "1.7",
                        marginBottom: '2rem'
                      }}
                      dangerouslySetInnerHTML={{
                        __html: pageContent || (idx === 0 ? '<p class="text-gray-300 italic">Start typing...</p>' : ''),
                      }}
                    />

                    {/* Closing & Signature - Only on Last Page */}
                    {idx === pages.length - 1 && (
                      <div className="mt-8 transition-all">
                        <p className="mb-6">Thanking you,</p>
                        <p className="mb-2">Yours faithfully,</p>

                        <div className="my-4" style={{ minHeight: "60px" }}>
                          {signatureUrl ? (
                            <img src={signatureUrl} alt="Signature" className="h-16 object-contain" />
                          ) : (
                            <div className="h-16 w-48 border-b border-dashed border-gray-200" />
                          )}
                        </div>

                        <p className="font-bold text-blue-900">Hon&apos;ble Member of Parliament</p>
                        <p className="text-sm text-gray-500">Constituency Name, Karnataka</p>
                      </div>
                    )}

                    {/* Footer - Every Page */}
                    <div className="absolute bottom-[15mm] left-[25mm] right-[25mm]">
                      <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-[9px] text-gray-400">
                        <p className="flex-1 text-center italic">
                          Office: Parliament House / Constituency Office &bull; Phone: +91-XXXXX-XXXXX &bull; Email: mp@smp.com
                        </p>
                        {pages.length > 1 && (
                          <div className="bg-gray-50 px-2 py-1 rounded text-[10px] font-bold text-gray-500 ml-2">
                            {idx + 1} / {pages.length}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
}
