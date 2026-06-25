"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Camera, 
  MapPin, 
  Send, 
  User, 
  Mail, 
  Phone, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  X
} from "lucide-react";
import Image from "next/image";
import { useCitizenReports } from "@/hooks/use-citizen-reports";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  "Road & Infrastructure",
  "Water Supply",
  "Electricity",
  "Sanitation & Garbage",
  "Street Lights",
  "Public Health",
  "Education",
  "Security",
  "Other"
];

export default function ReportProblemForm() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [referenceNo, setReferenceNo] = useState<string | null>(null);
  const { addReport } = useCitizenReports();
  const router = useRouter();

  // Form State
  const [formData, setFormData] = useState({
    complainantName: "",
    complainantPhone: "",
    complainantEmail: "",
    subject: "",
    description: "",
    category: "Other",
    location: "",
    lat: null as number | null,
    lng: null as number | null,
  });

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
      
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          location: `Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`
        }));
        setLoading(false);
      },
      (err) => {
        setError("Failed to get location: " + err.message);
        setLoading(false);
      }
    );
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.complainantName.trim()) {
        setError("Please enter your full name");
        return false;
      }
      if (!formData.complainantPhone.trim()) {
        setError("Please enter your phone number");
        return false;
      }
    } else if (step === 2) {
      if (!formData.subject.trim()) {
        setError("Please enter a short subject");
        return false;
      }
      if (!formData.description.trim()) {
        setError("Please enter a detailed description");
        return false;
      }
    }
    setError(null);
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep(s => s + 1);
    }
  };

  const prevStep = () => {
    setError(null);
    setStep(s => s - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!validateStep()) {
      setLoading(false);
      return;
    }

    try {
      // 1. Upload Images
      const uploadedUrls = [];
      for (const file of files) {
        const fileFormData = new FormData();
        fileFormData.append("file", file);
        fileFormData.append("path", `complaint-${Date.now()}-${file.name}`);
        
        const uploadRes = await fetch("/api/upload/guest", {
          method: "POST",
          body: fileFormData,
        });
        
        if (!uploadRes.ok) {
          const errorData = await uploadRes.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.detail || "Failed to upload images");
        }
        const { publicUrl } = await uploadRes.json();
        uploadedUrls.push(publicUrl);
      }

      // 2. Submit Complaint
      const payload = {
        ...formData,
        attachments: uploadedUrls,
      };

      console.log("Submitting Guest Complaint Payload:", payload);

      const res = await fetch("/api/complaints/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (errorData.fields) {
          throw new Error(`Missing fields: ${errorData.fields.join(", ")}`);
        }
        throw new Error(errorData.error || "Failed to submit complaint");
      }
      
      const complaint = await res.json();
      setReferenceNo(complaint.referenceNo);
      
      // 3. Track locally (Optional fallback)
      addReport({
        id: complaint.id,
        referenceNo: complaint.referenceNo,
        subject: complaint.subject,
        createdAt: new Date().toISOString(),
        status: "RECEIVED"
      });

      setSuccess(true);
      // Removed auto-redirect to allow users to see their reference number
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="max-w-xl mx-auto border-none shadow-2xl bg-white overflow-hidden rounded-3xl">
        <CardContent className="p-12 text-center space-y-8">
          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto"
          >
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </motion.div>
          
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-gray-900">Submission Received!</h2>
            <p className="text-gray-500">Your problem has been reported to the MP Office. Please save your reference number for tracking.</p>
          </div>

          <div className="bg-orange-50 border-2 border-dashed border-orange-200 p-6 rounded-2xl space-y-2">
            <p className="text-xs uppercase tracking-widest text-orange-600 font-bold">Your Reference ID</p>
            <p className="text-4xl font-mono font-black text-orange-600 tracking-tighter">{referenceNo}</p>
          </div>

          <div className="space-y-4 pt-4">
            <Button 
              className="w-full bg-black hover:bg-gray-800 text-white h-12 rounded-xl"
              onClick={() => {
                setSuccess(false);
                setStep(1);
                setFormData({
                  complainantName: "",
                  complainantPhone: "",
                  complainantEmail: "",
                  subject: "",
                  description: "",
                  category: "Other",
                  location: "",
                  lat: null,
                  lng: null,
                });
                setFiles([]);
                setPreviews([]);
              }}
            >
              Report Another Problem
            </Button>
            <p className="text-sm text-gray-500">
              You can track the progress at the bottom of the page using this ID.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto border-none shadow-2xl bg-white/80 backdrop-blur-xl overflow-hidden rounded-3xl">
      <div className="h-2 bg-gray-100 w-full">
        <motion.div 
          className="h-full bg-blue-600" 
          initial={{ width: "33.33%" }} 
          animate={{ width: `${(step / 3) * 100}%` }} 
        />
      </div>
      
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900">Personal Details</h3>
                  <p className="text-sm text-gray-500">How should we contact you regarding this issue?</p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input 
                        required 
                        className="pl-10" 
                        placeholder="John Doe" 
                        value={formData.complainantName}
                        onChange={e => setFormData({...formData, complainantName: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                          required
                          className="pl-10" 
                          placeholder="+91 98765 43210" 
                          value={formData.complainantPhone}
                          onChange={e => setFormData({...formData, complainantPhone: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Email (Optional)</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                          type="email" 
                          className="pl-10" 
                          placeholder="john@example.com" 
                          value={formData.complainantEmail}
                          onChange={e => setFormData({...formData, complainantEmail: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button type="button" className="w-full h-12 text-lg font-medium" onClick={nextStep}>
                  Next: Problem Details
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900">What is the problem?</h3>
                  <p className="text-sm text-gray-500">Provide clear details to help us resolve it quickly.</p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <select 
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Short Subject</Label>
                    <Input 
                      required 
                      placeholder="e.g. Large pothole on Main Street" 
                      value={formData.subject}
                      onChange={e => setFormData({...formData, subject: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Detailed Description</Label>
                    <Textarea 
                      required 
                      className="min-h-[120px]" 
                      placeholder="Describe the issue in detail..." 
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="flex gap-4 pt-2">
                  <Button type="button" variant="outline" className="flex-1 h-12" onClick={prevStep}>Back</Button>
                  <Button type="button" className="flex-[2] h-12" onClick={nextStep}>Next: Evidence</Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900">Location & Evidence</h3>
                  <p className="text-sm text-gray-500">Add photos and location to help us find the spot.</p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Problem Location</Label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Auto-detecting or enter address..." 
                        value={formData.location}
                        onChange={e => setFormData({...formData, location: e.target.value})}
                      />
                      <Button type="button" variant="secondary" onClick={getLocation} disabled={loading}>
                        <MapPin className="h-4 w-4 mr-2" />
                        Pin
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Upload Photos</Label>
                    <div 
                      className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer bg-gray-50/50"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-600">Click to upload photos</p>
                      <p className="text-xs text-gray-400 mt-1">Up to 3 high-quality images</p>
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        className="hidden" 
                        ref={fileInputRef} 
                        onChange={handleFileChange}
                      />
                    </div>
                    
                    {previews.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-4">
                        {previews.map((src, i) => (
                          <div key={i} className="relative aspect-square rounded-lg overflow-hidden border">
                            <Image src={src} alt="Preview" fill className="object-cover" />
                            <button 
                              type="button"
                              className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"
                              onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg flex items-center text-sm">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {error}
                  </div>
                )}
                
                <div className="flex gap-4 pt-2">
                  <Button type="button" variant="outline" className="flex-1 h-12" onClick={prevStep} disabled={loading}>Back</Button>
                  <Button type="submit" className="flex-[2] h-12" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Report
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </CardContent>
    </Card>
  );
}
