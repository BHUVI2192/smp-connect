"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Info, 
  Calendar, 
  FileText, 
  Upload, 
  Eye, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Mail,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";

const MINISTRIES = [
  "Ministry of Agriculture and Farmers Welfare",
  "Ministry of AYUSH",
  "Ministry of Chemicals and Fertilizers",
  "Ministry of Civil Aviation",
  "Ministry of Coal",
  "Ministry of Commerce and Industry",
  "Ministry of Communications",
  "Ministry of Consumer Affairs, Food and Public Distribution",
  "Ministry of Corporate Affairs",
  "Ministry of Culture",
  "Ministry of Defence",
  "Ministry of Development of North Eastern Region",
  "Ministry of Earth Sciences",
  "Ministry of Education",
  "Ministry of Electronics and Information Technology",
  "Ministry of Environment, Forest and Climate Change",
  "Ministry of External Affairs",
  "Ministry of Finance",
  "Ministry of Fisheries, Animal Husbandry and Dairying",
  "Ministry of Food Processing Industries",
  "Ministry of Health and Family Welfare",
  "Ministry of Heavy Industries",
  "Ministry of Home Affairs",
  "Ministry of Housing and Urban Affairs",
  "Ministry of Information and Broadcasting",
  "Ministry of Jal Shakti",
  "Ministry of Labour and Employment",
  "Ministry of Law and Justice",
  "Ministry of Micro, Small and Medium Enterprises",
  "Ministry of Mines",
  "Ministry of Minority Affairs",
  "Ministry of New and Renewable Energy",
  "Ministry of Panchayati Raj",
  "Ministry of Parliamentary Affairs",
  "Ministry of Personnel, Public Grievances and Pensions",
  "Ministry of Petroleum and Natural Gas",
  "Ministry of Power",
  "Ministry of Ports, Shipping and Waterways",
  "Ministry of Railways",
  "Ministry of Road Transport and Highways",
  "Ministry of Rural Development",
  "Ministry of Science and Technology",
  "Ministry of Skill Development and Entrepreneurship",
  "Ministry of Social Justice and Empowerment",
  "Ministry of Statistics and Programme Implementation",
  "Ministry of Steel",
  "Ministry of Textiles",
  "Ministry of Tourism",
  "Ministry of Tribal Affairs",
  "Ministry of Women and Child Development",
  "Ministry of Youth Affairs and Sports",
  "Prime Minister's Office"
];

const LETTER_TYPES = [
  "New Project Request",
  "Fund Sanction",
  "Grievance Redressal",
  "Policy Recommendation",
  "Meeting Request",
  "Information Query",
  "Status Update",
  "Urgent Intervention"
];

const STEPS = [
  { id: "basic", title: "BASIC INFO", icon: Info },
  { id: "dates", title: "DATES & PRIORITY", icon: Calendar },
  { id: "content", title: "CONTENT & LINK", icon: FileText },
  { id: "upload", title: "UPLOAD DOCUMENT", icon: Upload },
  { id: "review", title: "REVIEW & SUBMIT", icon: Eye },
];

interface ParliamentEntryFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialType?: "letter" | "question";
}

export default function ParliamentEntryForm({ onSuccess, onCancel, initialType = "letter" }: ParliamentEntryFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [entryType, setEntryType] = useState<"letter" | "question">(initialType);
  const [formData, setFormData] = useState<any>({
    referenceNo: "",
    subject: "",
    ministry: "",
    addressedTo: "",
    letterCategory: "Request",
    sentDate: new Date().toISOString().split('T')[0],
    expectedResponseDate: "",
    priority: "MEDIUM",
    summary: "",
    constituencyIssue: "",
    isReminderEnabled: false,
    reminderDate: "",
    documentUrl: "",
    type: "STARRED" // Default for questions/parliamentary letters
  });

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File is too large. Max 20MB allowed.");
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading("Uploading document...");

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("bucket", "images");
      uploadFormData.append("path", `parliament/${Date.now()}-${file.name}`);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      handleInputChange("documentUrl", data.publicUrl);
      toast.success("Document uploaded successfully!", { id: toastId });
    } catch (error) {
      toast.error("Upload failed. Please try again.", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch("/api/parliament", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          entityType: "letter", // Unified for now as per screenshots
          dateRaised: formData.sentDate
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      toast.success("Entry added to tracker successfully!");
      onSuccess();
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const renderStepIcon = (index: number) => {
    const StepIcon = STEPS[index].icon;
    const isActive = currentStep === index;
    const isCompleted = currentStep > index;

    return (
      <div key={STEPS[index].id} className="flex flex-col items-center relative z-10">
        <div 
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm",
            isActive ? "bg-primary text-primary-foreground" : 
            isCompleted ? "bg-emerald-500 text-white" : 
            "bg-muted border border-border text-muted-foreground"
          )}
        >
          {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
        </div>
        <span className={cn(
          "text-xs font-semibold mt-2",
          isActive ? "text-primary" : "text-muted-foreground"
        )}>
          {STEPS[index].title.toLowerCase()}
        </span>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-12">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Parliament Entry</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Add new letters or questions to the parliament tracker.</p>
        </div>
        <div className="flex gap-2 bg-muted p-1 rounded-xl border border-border">
          <Button 
            variant={entryType === "letter" ? "default" : "ghost"} 
            size="sm"
            className="rounded-lg px-4"
            onClick={() => setEntryType("letter")}
          >
            <Mail className="w-4 h-4 mr-2" />
            Letter
          </Button>
          <Button 
            variant={entryType === "question" ? "default" : "ghost"} 
            size="sm"
            className="rounded-lg px-4"
            onClick={() => setEntryType("question")}
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            Question
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex justify-between items-center mb-12 relative px-6">
        <div className="absolute top-5 left-12 right-12 h-[1px] bg-border -z-10" />
        <div 
          className="absolute top-5 left-12 h-[1px] bg-primary transition-all duration-500 -z-10" 
          style={{ width: `${(currentStep / (STEPS.length - 1)) * (100 - (100/STEPS.length))}%` }}
        />
        {STEPS.map((_, i) => renderStepIcon(i))}
      </div>

      {/* Form Content */}
      <Card className="border border-border shadow-sm rounded-xl overflow-hidden bg-card">
        <CardContent className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="min-h-[400px]"
            >
              {currentStep === 0 && (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 col-span-1">
                    <Label className="text-sm font-semibold text-gray-700 ml-1">Reference Number</Label>
                    <Input 
                      placeholder="e.g. MP/NED/2024/045" 
                      className="h-11 rounded-lg border-gray-200"
                      value={formData.referenceNo}
                      onChange={(e) => handleInputChange("referenceNo", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 col-span-1">
                    <Label className="text-sm font-semibold text-gray-700 ml-1">Subject</Label>
                    <Input 
                      placeholder="Policy query regarding..." 
                      className="h-11 rounded-lg border-gray-200"
                      value={formData.subject}
                      onChange={(e) => handleInputChange("subject", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 col-span-1">
                    <Label className="text-sm font-semibold text-gray-700 ml-1">Ministry</Label>
                    <Select value={formData.ministry} onValueChange={(v) => handleInputChange("ministry", v)}>
                      <SelectTrigger className="h-11 rounded-lg border-gray-200">
                        <SelectValue placeholder="Select Ministry" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg max-h-[300px]">
                        {MINISTRIES.map(m => (
                          <SelectItem key={m} value={m} className="cursor-pointer">
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-1">
                    <Label className="text-sm font-semibold text-gray-700 ml-1">Addressed To</Label>
                    <Input 
                      className="h-11 rounded-lg border-gray-200"
                      value={formData.addressedTo}
                      onChange={(e) => handleInputChange("addressedTo", e.target.value)}
                    />
                  </div>
                  <div className="space-y-3 col-span-2">
                    <Label className="text-sm font-semibold text-gray-700 ml-1">Letter Type</Label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {LETTER_TYPES.map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleInputChange("letterCategory", type)}
                          className={cn(
                            "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
                            formData.letterCategory === type 
                              ? "bg-primary text-primary-foreground shadow-sm" 
                              : "bg-muted text-muted-foreground hover:bg-muted/80 border border-transparent"
                          )}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 ml-1">Sent Date</Label>
                    <Input 
                      type="date" 
                      className="h-11 rounded-lg border-gray-200"
                      value={formData.sentDate}
                      onChange={(e) => handleInputChange("sentDate", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 ml-1">Expected Response Date</Label>
                    <Input 
                      type="date" 
                      className="h-11 rounded-lg border-gray-200"
                      value={formData.expectedResponseDate}
                      onChange={(e) => handleInputChange("expectedResponseDate", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 space-y-4 pt-4">
                    <Label className="text-sm font-semibold text-gray-700 ml-1">Priority</Label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { id: "HIGH", label: "High", color: "bg-rose-500" },
                        { id: "MEDIUM", label: "Medium", color: "bg-amber-400" },
                        { id: "LOW", label: "Low", color: "bg-emerald-400" },
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleInputChange("priority", p.id)}
                          className={cn(
                            "flex items-center justify-center gap-3 p-4 rounded-xl border transition-all duration-200",
                            formData.priority === p.id 
                              ? "bg-primary/5 border-primary ring-1 ring-primary" 
                              : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                          )}
                        >
                          <div className={cn("w-2 h-2 rounded-full", p.color)} />
                          <span className="font-semibold text-sm">{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 ml-1">Summary</Label>
                    <Textarea 
                      placeholder="Brief overview of the letter content..."
                      className="min-h-[140px] rounded-lg border-gray-200 resize-none"
                      value={formData.summary}
                      onChange={(e) => handleInputChange("summary", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 ml-1">Constituency Issue</Label>
                    <Textarea 
                      placeholder="Explain how this relates to the constituency..."
                      className="min-h-[140px] rounded-lg border-gray-200 resize-none"
                      value={formData.constituencyIssue}
                      onChange={(e) => handleInputChange("constituencyIssue", e.target.value)}
                    />
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-8">
                  <div 
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    className={cn(
                      "border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center transition-all group cursor-pointer relative overflow-hidden",
                      formData.documentUrl 
                        ? "border-emerald-200 bg-emerald-50/20" 
                        : "border-border hover:border-primary/50 hover:bg-primary/5",
                      isUploading && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={handleFileUpload}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    
                    {isUploading ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                        <h3 className="text-xl font-bold text-gray-900">Processing Documents...</h3>
                      </div>
                    ) : formData.documentUrl ? (
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                          <CheckCircle2 className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Upload Complete!</h3>
                        <p className="text-emerald-600 text-sm font-semibold mt-1">Document is ready</p>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="mt-4 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInputChange("documentUrl", "");
                          }}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4 border transition-transform">
                          <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Upload Supportings</h3>
                        <p className="text-muted-foreground mt-1 text-sm font-medium">PDF, JPG, PNG supported. Max 20MB.</p>
                        <Button variant="outline" className="mt-6 h-11 px-8 rounded-lg font-semibold">
                          Browse Files
                        </Button>
                      </>
                    )}
                  </div>

                  <div className="bg-muted/30 rounded-2xl p-6 flex items-center justify-between group transition-all border border-border">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <Calendar className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">Set Follow-up Reminder</h4>
                        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Notify on specific date</p>
                      </div>
                    </div>
                    <Switch 
                      checked={formData.isReminderEnabled} 
                      onCheckedChange={(v) => handleInputChange("isReminderEnabled", v)}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>

                  {formData.isReminderEnabled && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2 px-2"
                    >
                      <Label className="text-xs font-semibold text-gray-500 ml-1">Reminder Date</Label>
                      <Input 
                        type="date" 
                        className="h-11 rounded-lg border-gray-200"
                        value={formData.reminderDate}
                        onChange={(e) => handleInputChange("reminderDate", e.target.value)}
                      />
                    </motion.div>
                  )}
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-8">
                  <div className="bg-muted/30 rounded-2xl p-8 relative overflow-hidden border border-border">
                    <div className="absolute top-0 right-0 p-6">
                       <span className={cn(
                         "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm",
                         formData.priority === 'HIGH' ? "bg-rose-100 text-rose-600" :
                         formData.priority === 'MEDIUM' ? "bg-amber-100 text-amber-600" :
                         "bg-emerald-100 text-emerald-600"
                       )}>
                         {formData.priority} Priority
                       </span>
                    </div>

                    <div className="space-y-6 pr-24">
                      <div className="w-8 h-1.5 bg-primary rounded-full opacity-20" />
                      <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                        {formData.subject || "Untitled Entry"}
                      </h2>
                      
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-1">Ministry</p>
                          <p className="font-semibold text-gray-800">{formData.ministry || "Not selected"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-1">Reference No.</p>
                          <p className="font-semibold text-gray-800">{formData.referenceNo || "N/A"}</p>
                        </div>
                      </div>

                      <div className="space-y-3 pt-4 border-t border-border">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Summary</p>
                        <p className="text-gray-600 leading-relaxed text-sm font-medium">
                          {formData.summary || "No summary provided."}
                        </p>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-border flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/5 rounded-lg flex items-center justify-center border border-primary/10">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-gray-900">Document Uploaded</p>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Ready for submission</p>
                          </div>
                        </div>
                        <CheckCircle2 className="w-6 h-6 text-primary opacity-20" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-50/50 rounded-2xl p-6 flex items-center justify-between border border-emerald-100">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-emerald-100">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-emerald-900">Ready to Submit</h4>
                        <p className="text-emerald-600 text-[10px] font-bold uppercase tracking-wider">Review all details before finalizing</p>
                      </div>
                    </div>
                    <Button 
                      onClick={handleSubmit}
                      className="h-11 px-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                      Submit to Tracker
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Footer Navigation */}
          <div className="flex justify-between mt-10 pt-8 border-t border-gray-100">
            <Button
              variant="outline"
              type="button"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="h-11 px-6 rounded-lg font-semibold disabled:opacity-30 group"
            >
              <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back
            </Button>
            
            {currentStep < STEPS.length - 1 && (
              <Button
                type="button"
                onClick={nextStep}
                className="h-11 px-8 rounded-lg font-semibold group"
              >
                Next Step
                <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-center mt-6">
        <button 
          onClick={onCancel}
          type="button"
          className="text-muted-foreground hover:text-foreground font-semibold text-xs tracking-wide transition-colors p-2"
        >
          Cancel and return to tracker
        </button>
      </div>
    </div>
  );
}
