"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Undo, Redo,
} from "lucide-react";

interface LetterData {
  subject: string;
  body: string;
  recipientName: string;
  recipientDesignation: string;
  recipientAddress: string;
  letterDate: string;
  referenceNo: string;
  department: string;
}

interface LetterEditorProps {
  data: LetterData;
  onChange: (data: LetterData) => void;
}

export function LetterEditor({ data, onChange }: LetterEditorProps) {
  const editorRef = React.useRef<HTMLDivElement>(null);

  const update = (field: keyof LetterData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  function execCommand(command: string, value?: string) {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    // Sync content back
    if (editorRef.current) {
      onChange({ ...data, body: editorRef.current.innerHTML });
    }
  }

  // Initialize editor with existing content
  useEffect(() => {
    if (editorRef.current && data.body && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = data.body;
    }
  }, []);

  const handleEditorInput = useCallback(() => {
    if (editorRef.current) {
      onChange({ ...data, body: editorRef.current.innerHTML });
    }
  }, [data, onChange]);

  const toolbarBtn = (icon: React.ReactNode, cmd: string, val?: string) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); execCommand(cmd, val); }}
      className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600 hover:text-gray-900"
      title={cmd}
    >
      {icon}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Meta Fields */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-gray-500 uppercase tracking-wider">Reference No.</Label>
          <Input
            value={data.referenceNo}
            onChange={(e) => update("referenceNo", e.target.value)}
            placeholder="MP/2026/GEN/001"
            className="mt-1 font-mono text-sm"
          />
        </div>
        <div>
          <Label className="text-xs text-gray-500 uppercase tracking-wider">Date</Label>
          <Input
            type="date"
            value={data.letterDate}
            onChange={(e) => update("letterDate", e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs text-gray-500 uppercase tracking-wider">Department</Label>
        <Input
          value={data.department}
          onChange={(e) => update("department", e.target.value)}
          placeholder="e.g. Public Works, Revenue, Health"
          className="mt-1"
        />
      </div>

      <Separator />

      {/* Recipient */}
      <div className="space-y-3">
        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Recipient Details</p>
        <div>
          <Label className="text-xs">Name</Label>
          <Input
            value={data.recipientName}
            onChange={(e) => update("recipientName", e.target.value)}
            placeholder="Shri/Smt. Name"
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">Designation</Label>
          <Input
            value={data.recipientDesignation}
            onChange={(e) => update("recipientDesignation", e.target.value)}
            placeholder="District Collector, Commissioner, etc."
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">Address</Label>
          <Input
            value={data.recipientAddress}
            onChange={(e) => update("recipientAddress", e.target.value)}
            placeholder="Office address"
            className="mt-1"
          />
        </div>
      </div>

      <Separator />

      {/* Subject */}
      <div>
        <Label className="text-xs text-gray-500 uppercase tracking-wider">Subject</Label>
        <Input
          value={data.subject}
          onChange={(e) => update("subject", e.target.value)}
          placeholder="Subject of the letter"
          className="mt-1 font-medium"
        />
      </div>

      <Separator />

      {/* Rich Text Editor */}
      <div>
        <Label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Letter Body</Label>

        {/* Toolbar */}
        <div className="flex items-center gap-0.5 p-1.5 bg-gray-50 border border-b-0 rounded-t-md flex-wrap">
          {toolbarBtn(<Bold className="h-4 w-4" />, "bold")}
          {toolbarBtn(<Italic className="h-4 w-4" />, "italic")}
          {toolbarBtn(<Underline className="h-4 w-4" />, "underline")}
          <div className="w-px h-5 bg-gray-300 mx-1" />
          {toolbarBtn(<AlignLeft className="h-4 w-4" />, "justifyLeft")}
          {toolbarBtn(<AlignCenter className="h-4 w-4" />, "justifyCenter")}
          {toolbarBtn(<AlignRight className="h-4 w-4" />, "justifyRight")}
          <div className="w-px h-5 bg-gray-300 mx-1" />
          {toolbarBtn(<List className="h-4 w-4" />, "insertUnorderedList")}
          {toolbarBtn(<ListOrdered className="h-4 w-4" />, "insertOrderedList")}
          <div className="w-px h-5 bg-gray-300 mx-1" />
          {toolbarBtn(<Undo className="h-4 w-4" />, "undo")}
          {toolbarBtn(<Redo className="h-4 w-4" />, "redo")}
          <div className="w-px h-5 bg-gray-300 mx-1" />
          <select
            onChange={(e) => execCommand("fontSize", e.target.value)}
            className="text-xs bg-transparent border-0 outline-none cursor-pointer"
            defaultValue="3"
          >
            <option value="1">Small</option>
            <option value="3">Normal</option>
            <option value="5">Large</option>
          </select>
        </div>

        {/* Editable Area */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleEditorInput}
          className="min-h-[300px] p-4 border rounded-b-md bg-white text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/20 prose prose-sm max-w-none"
          style={{ fontFamily: "'Inter', 'Noto Sans Kannada', sans-serif" }}
        />
      </div>
    </div>
  );
}
