/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import { formatDate } from "@/lib/utils";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface RailwayEqPreviewProps {
  passengerName: string;
  passengerAge: string;
  passengerGender: string;
  fromStation: string;
  toStation: string;
  travelDate: string;
  coachPreference: string;
  pnrNo: string;
  trainNo?: string;
  trainName?: string;
  remarks?: string;
  signatureUrl?: string;
}

export function RailwayEqPreview({
  passengerName,
  passengerAge,
  passengerGender,
  fromStation,
  toStation,
  travelDate,
  coachPreference,
  pnrNo,
  trainNo,
  trainName,
  remarks,
  signatureUrl,
}: RailwayEqPreviewProps) {
  return (
    <div className="relative bg-gray-200/80 rounded-lg overflow-hidden h-[calc(100vh-200px)] border border-gray-300">
      <TransformWrapper
        initialScale={0.8}
        minScale={0.3}
        maxScale={2.5}
        centerOnInit={true}
        wheel={{ step: 0.1 }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div className="absolute top-4 right-4 z-10 flex gap-1 shadow-md bg-white/90 backdrop-blur-sm p-1.5 rounded-lg border border-gray-200 opacity-80 hover:opacity-100 transition-opacity">
              <button type="button" onClick={() => zoomIn()} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50" title="Zoom In">
                <ZoomIn className="w-5 h-5" />
              </button>
              <div className="w-[1px] bg-gray-300 my-1 mx-0.5"></div>
              <button type="button" onClick={() => zoomOut()} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50" title="Zoom Out">
                <ZoomOut className="w-5 h-5" />
              </button>
              <div className="w-[1px] bg-gray-300 my-1 mx-0.5"></div>
              <button type="button" onClick={() => resetTransform()} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50" title="Fit to Screen">
                <Maximize className="w-5 h-5" />
              </button>
            </div>
            
            <TransformComponent wrapperClass="!w-full !h-full cursor-grab active:cursor-grabbing" contentClass="!w-full !h-full flex justify-center items-center">
              <div 
                id="printable-railway-eq"
                className="bg-white shadow-2xl flex flex-col relative shrink-0"
                style={{
                  width: "210mm",
                  height: "297mm",
                  padding: "20mm 25mm 25mm 25mm",
                  fontFamily: "'Inter', 'Noto Sans Kannada', serif",
                  fontSize: "11pt",
                  lineHeight: "1.6",
                }}
              >
        {/* Header */}
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
          <div className="flex items-center justify-center mb-1">
            <div className="w-12 h-12 rounded-full bg-blue-900 flex items-center justify-center text-white font-bold text-lg shrink-0 mr-3">
              भा
            </div>
            <div className="text-left">
              <p className="text-xs tracking-[0.3em] text-gray-500 uppercase">
                Member of Parliament
              </p>
              <h1 className="text-xl font-bold text-gray-900 tracking-wide">
                OFFICE OF THE HON&apos;BLE MEMBER OF PARLIAMENT
              </h1>
              <p className="text-xs text-gray-500">
                Lok Sabha / Rajya Sabha &bull; Constituency Name, Karnataka
              </p>
            </div>
          </div>
        </div>

        {/* Date Row */}
        <div className="flex justify-between items-start mb-6 text-sm">
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider font-medium">
              Ref No.
            </p>
            <p className="font-mono font-semibold text-gray-900">MP/EQ/____/____</p>
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-xs uppercase tracking-wider font-medium">
              Date
            </p>
            <p className="font-semibold text-gray-900">
              {formatDate(new Date().toISOString(), "long")}
            </p>
          </div>
        </div>

        {/* Recipient */}
        <div className="mb-6">
          <p className="font-medium text-gray-800">To,</p>
          <div className="space-y-0.5 ml-2 mt-1">
            <p className="font-semibold text-gray-900">The Divisional Railway Manager,</p>
            <p className="text-gray-800">Indian Railways,</p>
            <p className="text-gray-800">Concerned Division.</p>
          </div>
        </div>

        {/* Subject */}
        <div className="mb-6 text-gray-900">
          <p>
            <span className="font-semibold">Subject: </span>
            <span className="underline decoration-1 underline-offset-4 font-medium">
              Request for release of Emergency Quota for Train No.{" "}
              {trainNo || "_______"}
            </span>
          </p>
        </div>

        {/* Salutation */}
        <p className="mb-4 text-gray-900">Respected Sir/Madam,</p>

        {/* Body */}
        <div className="mb-8 text-justify whitespace-pre-wrap text-gray-800 leading-relaxed max-w-full flex-grow">
          <p className="mb-4">
            This is to kindly request you to release the Emergency Quota against
            PNR No. <span className="font-bold tracking-wider">{pnrNo || ".........."}</span> for
            the upcoming journey on{" "}
            <span className="font-bold">
              {travelDate
                ? formatDate(travelDate, "long")
                : "___________________"}
            </span>
            .
          </p>
          <p className="mb-3 font-medium text-gray-900">
            The passenger details are as follows:
          </p>

          <div className="overflow-hidden rounded-md border border-gray-300 mb-6">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-gray-50/50">
                  <td className="px-4 py-2 bg-gray-100/50 font-semibold text-gray-900 w-1/3 border-r border-gray-200">
                    Passenger Name
                  </td>
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {passengerName || "___________________"}
                  </td>
                </tr>
                <tr className="hover:bg-gray-50/50">
                  <td className="px-4 py-2 bg-gray-100/50 font-semibold text-gray-900 border-r border-gray-200">
                    Age / Gender
                  </td>
                  <td className="px-4 py-2 text-gray-800">
                    {passengerAge ? `${passengerAge} Yrs` : "___ Yrs"} /{" "}
                    {passengerGender || "___"}
                  </td>
                </tr>
                <tr className="hover:bg-gray-50/50">
                  <td className="px-4 py-2 bg-gray-100/50 font-semibold text-gray-900 border-r border-gray-200">
                    Train No. & Name
                  </td>
                  <td className="px-4 py-2 text-gray-800">
                    <span className="font-semibold text-gray-900">{trainNo || "_______"}</span> — {trainName || "________________"}
                  </td>
                </tr>
                <tr className="hover:bg-gray-50/50">
                  <td className="px-4 py-2 bg-gray-100/50 font-semibold text-gray-900 border-r border-gray-200">
                    Route
                  </td>
                  <td className="px-4 py-2 text-gray-800">
                    {fromStation || "_______"} <span className="text-gray-400 mx-1">to</span> {toStation || "_______"}
                  </td>
                </tr>
                <tr className="hover:bg-gray-50/50">
                  <td className="px-4 py-2 bg-gray-100/50 font-semibold text-gray-900 border-r border-gray-200">
                    Class / Coach
                  </td>
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {coachPreference || "_______"}
                  </td>
                </tr>
                <tr className="hover:bg-gray-50/50">
                  <td className="px-4 py-2 bg-gray-100/50 font-semibold text-gray-900 border-r border-gray-200">
                    PNR Number
                  </td>
                  <td className="px-4 py-2 font-mono font-bold text-gray-900 text-[15px]">
                    {pnrNo || ".........."}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {remarks && (
            <div className="mb-4 text-gray-800">
              <span className="font-semibold">Note:</span> {remarks}
            </div>
          )}

          <p className="mt-4">
            I request you to kindly consider this matter favorably and release
            the requested Emergency Quota.
          </p>
        </div>

        {/* Closing */}
        <div className="mt-8 pb-12">
          <p className="mb-10 text-gray-900">Thanking you,</p>
          <p className="mb-1 text-gray-900">Yours faithfully,</p>
          <div className="mt-4 mb-2" style={{ minHeight: "60px" }}>
            {signatureUrl ? (
              <img
                src={signatureUrl}
                alt="Signature"
                className="h-16 object-contain"
              />
            ) : (
              <div className="h-16 w-48 border-b border-dashed border-gray-300" />
            )}
          </div>
          <p className="font-bold text-gray-900">
            Hon&apos;ble Member of Parliament
          </p>
          <p className="text-sm text-gray-600">
            Constituency Name, Karnataka
          </p>
        </div>

        {/* Footer */}
        <div 
          className="absolute bottom-0 left-0 right-0 border-t border-gray-300 py-3 px-8 text-center text-xs text-gray-500"
          style={{ bottom: "15mm", left: "25mm", right: "25mm" }}
        >
          <p>
            Office Address: Parliament House / Constituency Office &bull; Phone:
            +91-XXXXX-XXXXX &bull; Email: mp@smp.com
          </p>
        </div>
      </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
}
