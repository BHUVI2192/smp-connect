"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { PageHeader, LoadingSpinner, EmptyState, StatCard } from "@/components/shared/page-helpers";
import { 
  Plus, Users, Search, Star, Eye, ArrowLeft, Trash2, Phone, Mail as MailIcon, 
  Building2, MapPin, Check, ChevronRight, User, Map as MapIcon, MoreHorizontal,
  Briefcase, Tag, Calendar
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

type ViewMode = "list" | "detail" | "wizard";

const CATEGORIES = ["Government", "Media", "Social", "Education", "Business", "Political", "Religious", "Legal", "Health", "Other"];

interface ContactForm {
  id?: string;
  fullName: string;
  phone: string;
  email: string;
  designation: string;
  organization: string;
  category: string;
  is_vip: boolean;
  stateId: string;
  districtId: string;
  talukId: string;
  panchayatId: string;
  villageId: string;
  address: string;
  birthday: string;
  anniversary: string;
  notes: string;
  tags: string[];
}

const INITIAL_FORM: ContactForm = {
  fullName: "", phone: "", email: "", designation: "", organization: "",
  category: "Other", is_vip: false, stateId: "", districtId: "", talukId: "",
  panchayatId: "", villageId: "", address: "", birthday: "", anniversary: "",
  notes: "", tags: [],
};

export default function StaffContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selected, setSelected] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  
  // Wizard State
  const [form, setForm] = useState<ContactForm>(INITIAL_FORM);
  const [wizardStep, setWizardStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Location Data
  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [taluks, setTaluks] = useState<any[]>([]);
  const [panchayats, setPanchayats] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);

  useEffect(() => { 
    fetchContacts(); 
    fetchStates();
  }, []);

  async function fetchContacts() {
    setLoading(true);
    try {
      const res = await fetch("/api/contacts?pageSize=200");
      const d = await res.json();
      setContacts(d.data || []);
    } catch (err) {
      toast.error("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }

  // ─── Location Fetchers ───────────────────────────────────────────────
  async function fetchStates() {
    try {
      const res = await fetch("/api/locations/states");
      const d = await res.json();
      setStates(d.data || []);
    } catch (err) {}
  }

  async function fetchDistricts(stateId: string) {
    if (!stateId) return;
    try {
      const res = await fetch(`/api/locations/districts?stateId=${stateId}`);
      const d = await res.json();
      setDistricts(d.data || []);
    } catch (err) {}
  }

  async function fetchTaluks(districtId: string) {
    if (!districtId) return;
    try {
      const res = await fetch(`/api/locations/taluks?districtId=${districtId}`);
      const d = await res.json();
      setTaluks(d.data || []);
    } catch (err) {}
  }

  async function fetchPanchayats(talukId: string) {
    if (!talukId) return;
    try {
      const res = await fetch(`/api/locations/panchayats?talukId=${talukId}`);
      const d = await res.json();
      setPanchayats(d.data || []);
    } catch (err) {}
  }

  async function fetchVillages(panchayatId: string) {
    if (!panchayatId) return;
    try {
      const res = await fetch(`/api/locations/villages?panchayatId=${panchayatId}`);
      const d = await res.json();
      setVillages(d.data || []);
    } catch (err) {}
  }

  // ─── Handlers ────────────────────────────────────────────────────────
  async function saveContact() {
    if (!form.fullName) { toast.error("Full Name is required"); setWizardStep(1); return; }
    
    setIsSubmitting(true);
    try {
      const method = form.id ? "PUT" : "POST";
      const res = await fetch("/api/contacts", { 
        method, 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(form) 
      });
      
      if (res.ok) {
        toast.success(form.id ? "Contact updated" : "Contact added successfully");
        setViewMode("list");
        fetchContacts();
        setForm(INITIAL_FORM);
        setWizardStep(1);
      } else {
        toast.error("Failed to save contact");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteContact(id: string) {
    if (!confirm("Are you sure you want to delete this contact?")) return;
    try {
      const res = await fetch(`/api/contacts?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Contact deleted");
        fetchContacts();
        if (selected?.id === id) { setSelected(null); setViewMode("list"); }
      }
    } catch (err) {
      toast.error("Failed to delete contact");
    }
  }

  const filtered = contacts.filter((c) => {
    if (categoryFilter !== "ALL" && c.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (c.fullName || c.full_name || "").toLowerCase().includes(q) ||
        (c.phone || "").includes(q) ||
        (c.organization || "").toLowerCase().includes(q) ||
        (c.designation || "").toLowerCase().includes(q);
    }
    return true;
  });

  const categoryCounts = contacts.reduce((acc: Record<string, number>, c) => {
    const cat = c.category || "Uncategorized";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  // ─── WIZARD VIEW ──────────────────────────────
  if (viewMode === "wizard") {
    const steps = ["Basic Info", "Location", "Additional Details"];
    
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => { setViewMode("list"); setForm(INITIAL_FORM); }}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{form.id ? "Edit Contact" : "New Contact CRM"}</h1>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                  wizardStep === i + 1 ? "bg-blue-600 border-blue-600 text-white" :
                  wizardStep > i + 1 ? "bg-green-500 border-green-500 text-white" : "bg-white border-gray-200 text-gray-400"
                }`}>
                  {wizardStep > i + 1 ? <Check className="h-5 w-5" /> : i + 1}
                </div>
                <span className={`text-xs font-medium ${wizardStep === i + 1 ? "text-blue-600" : "text-gray-400"}`}>{s}</span>
              </div>
              {i < steps.length - 1 && <div className={`h-0.5 flex-1 mx-2 ${wizardStep > i + 1 ? "bg-green-500" : "bg-gray-200"}`} />}
            </React.Fragment>
          ))}
        </div>

        <Card className="border-none shadow-xl bg-white/80 backdrop-blur-md">
          <CardContent className="p-6">
            {/* Step 1: Basic Info */}
            {wizardStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 text-blue-600 font-semibold mb-4">
                  <User className="h-5 w-5" /> <span>Identity & Organization</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-gray-700">Full Name *</Label>
                    <Input 
                      placeholder="e.g. Rajesh Kumar" 
                      value={form.fullName} 
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })} 
                      className="bg-gray-50/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger className="bg-gray-50/50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Phone Number</Label>
                    <Input 
                      placeholder="+91 00000 00000" 
                      value={form.phone} 
                      onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                      className="bg-gray-50/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Email Address</Label>
                    <Input 
                      placeholder="rajesh@example.com" 
                      value={form.email} 
                      onChange={(e) => setForm({ ...form, email: e.target.value })} 
                      className="bg-gray-50/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Designation</Label>
                    <Input 
                      placeholder="e.g. Secretary, President" 
                      value={form.designation} 
                      onChange={(e) => setForm({ ...form, designation: e.target.value })} 
                      className="bg-gray-50/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Organization</Label>
                    <Input 
                      placeholder="e.g. Village Council, District Office" 
                      value={form.organization} 
                      onChange={(e) => setForm({ ...form, organization: e.target.value })} 
                      className="bg-gray-50/50"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-3">
                    <Star className={`h-5 w-5 ${form.is_vip ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">VIP Contact</p>
                      <p className="text-xs text-gray-500">Prioritize this contact in the CRM</p>
                    </div>
                  </div>
                  <Switch checked={form.is_vip} onCheckedChange={(v) => setForm({ ...form, is_vip: v })} />
                </div>
              </div>
            )}

            {/* Step 2: Location */}
            {wizardStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 text-red-500 font-semibold mb-4">
                  <MapIcon className="h-5 w-5" /> <span>Constituency & Location Hierarchy</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-gray-700">State</Label>
                    <Select 
                      value={form.stateId} 
                      onValueChange={(v) => {
                        setForm({ ...form, stateId: v, districtId: "", talukId: "", panchayatId: "", villageId: "" });
                        fetchDistricts(v);
                      }}
                    >
                      <SelectTrigger className="bg-gray-50/50"><SelectValue placeholder="Select State" /></SelectTrigger>
                      <SelectContent>
                        {states.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700">District</Label>
                    <Select 
                      disabled={!form.stateId}
                      value={form.districtId} 
                      onValueChange={(v) => {
                        setForm({ ...form, districtId: v, talukId: "", panchayatId: "", villageId: "" });
                        fetchTaluks(v);
                      }}
                    >
                      <SelectTrigger className="bg-gray-50/50"><SelectValue placeholder="Select District" /></SelectTrigger>
                      <SelectContent>
                        {districts.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700">Taluk</Label>
                    <Select 
                      disabled={!form.districtId}
                      value={form.talukId} 
                      onValueChange={(v) => {
                        setForm({ ...form, talukId: v, panchayatId: "", villageId: "" });
                        fetchPanchayats(v);
                      }}
                    >
                      <SelectTrigger className="bg-gray-50/50"><SelectValue placeholder="Select Taluk" /></SelectTrigger>
                      <SelectContent>
                        {taluks.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700">Gram Panchayat</Label>
                    <Select 
                      disabled={!form.talukId}
                      value={form.panchayatId} 
                      onValueChange={(v) => {
                        setForm({ ...form, panchayatId: v, villageId: "" });
                        fetchVillages(v);
                      }}
                    >
                      <SelectTrigger className="bg-gray-50/50"><SelectValue placeholder="Select Panchayat" /></SelectTrigger>
                      <SelectContent>
                        {panchayats.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700">Village</Label>
                    <Select 
                      disabled={!form.panchayatId}
                      value={form.villageId} 
                      onValueChange={(v) => setForm({ ...form, villageId: v })}
                    >
                      <SelectTrigger className="bg-gray-50/50"><SelectValue placeholder="Select Village" /></SelectTrigger>
                      <SelectContent>
                        {villages.map(v => <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Physical Address</Label>
                  <Textarea 
                    placeholder="Enter house no, street, landmark..." 
                    value={form.address} 
                    onChange={(e) => setForm({ ...form, address: e.target.value })} 
                    className="bg-gray-50/50"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Extras */}
            {wizardStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 text-green-600 font-semibold mb-4">
                  <MoreHorizontal className="h-5 w-5" /> <span>Observations & Key Dates</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-gray-700">Birthday</Label>
                    <Input 
                      type="date" 
                      value={form.birthday} 
                      onChange={(e) => setForm({ ...form, birthday: e.target.value })} 
                      className="bg-gray-50/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Anniversary</Label>
                    <Input 
                      type="date" 
                      value={form.anniversary} 
                      onChange={(e) => setForm({ ...form, anniversary: e.target.value })} 
                      className="bg-gray-50/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Tags (comma separated)</Label>
                  <Input 
                    placeholder="e.g. Influencer, Volunteer, Donor" 
                    value={form.tags.join(", ")} 
                    onChange={(e) => setForm({ ...form, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })} 
                    className="bg-gray-50/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Internal Notes</Label>
                  <Textarea 
                    placeholder="Capture personal preferences, relationship history, etc." 
                    value={form.notes} 
                    onChange={(e) => setForm({ ...form, notes: e.target.value })} 
                    className="bg-gray-50/50"
                    rows={5}
                  />
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="p-6 bg-gray-50/50 flex justify-between rounded-b-xl border-t">
            <Button variant="outline" onClick={() => wizardStep === 1 ? setViewMode("list") : setWizardStep(wizardStep - 1)}>
              {wizardStep === 1 ? "Cancel" : "Back"}
            </Button>
            {wizardStep < 3 ? (
              <Button onClick={() => setWizardStep(wizardStep + 1)} className="gap-2">
                Next Step <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={saveContact} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 gap-2">
                {isSubmitting ? <LoadingSpinner /> : <><Check className="h-4 w-4" /> Finish & Save</>}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  }

  // ─── DETAIL VIEW ──────────────────────────────
  if (viewMode === "detail" && selected) {
    const c = selected;
    return (
      <div className="space-y-6 pb-20 max-w-6xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setViewMode("list")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{c.fullName || c.full_name}</h1>
              {c.is_vip && <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-none"><Star className="h-3 w-3 fill-yellow-500 mr-1" /> VIP</Badge>}
            </div>
            <p className="text-sm text-gray-500">{[c.designation, c.organization].filter(Boolean).join(" • ")}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { 
                setForm({ 
                  ...INITIAL_FORM, 
                  ...c, 
                  id: c.id,
                  birthday: c.birthday ? c.birthday.split('T')[0] : "",
                  anniversary: c.anniversary ? c.anniversary.split('T')[0] : "",
                  stateId: c.stateId?.toString() || "",
                  districtId: c.districtId?.toString() || "",
                  talukId: c.talukId?.toString() || "",
                  panchayatId: c.panchayatId?.toString() || "",
                  villageId: c.villageId?.toString() || "",
                }); 
                if (c.stateId) fetchDistricts(c.stateId);
                if (c.districtId) fetchTaluks(c.districtId);
                if (c.talukId) fetchPanchayats(c.talukId);
                if (c.panchayatId) fetchVillages(c.panchayatId);
                setViewMode("wizard"); 
                setWizardStep(1);
              }}>
              Edit Profile
            </Button>
            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => deleteContact(c.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-sm h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <User className="h-4 w-4" /> Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Phone className="h-4 w-4" /></div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5 uppercase tracking-wider">Phone</p>
                      <p className="text-sm font-medium text-gray-900">{c.phone || "No phone added"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><MailIcon className="h-4 w-4" /></div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5 uppercase tracking-wider">Email</p>
                      <p className="text-sm font-medium text-gray-900">{c.email || "No email added"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><Building2 className="h-4 w-4" /></div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5 uppercase tracking-wider">Organization</p>
                      <p className="text-sm font-medium text-gray-900">{c.organization || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><Briefcase className="h-4 w-4" /></div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5 uppercase tracking-wider">Designation</p>
                      <p className="text-sm font-medium text-gray-900">{c.designation || "—"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Location Details</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { l: "State", v: (c.state?.name || c.state) },
                      { l: "District", v: (c.district?.name || c.district) },
                      { l: "Taluk", v: (c.taluk?.name || c.taluk) },
                      { l: "Panchayat", v: (c.panchayat?.name || c.panchayat) },
                      { l: "Village", v: (c.village?.name || c.village) },
                    ].filter(x => x.v).map(x => (
                      <Badge key={x.l} variant="secondary" className="bg-gray-100 text-gray-600 font-normal">
                        <span className="text-gray-400 mr-1">{x.l}:</span> {x.v}
                      </Badge>
                    ))}
                  </div>
                  {c.address && (
                    <div className="flex items-start gap-3 pt-2">
                       <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                       <p className="text-sm text-gray-600 italic leading-relaxed">{c.address}</p>
                    </div>
                  )}
                </div>
                
                {c.notes && (
                  <div className="pt-4 border-t">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Observations & Notes</p>
                    <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {c.notes}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Milestones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600"><Calendar className="h-4 w-4 text-pink-500" /> Birthday</div>
                  <span className="text-sm font-semibold">{c.birthday ? formatDate(c.birthday) : "—"}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-600"><Calendar className="h-4 w-4 text-blue-500" /> Anniversary</div>
                  <span className="text-sm font-semibold">{c.anniversary ? formatDate(c.anniversary) : "—"}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Categories & Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Primary Category</span>
                  <Badge className="bg-blue-50 text-blue-600 border-none">{c.category || "General"}</Badge>
                </div>
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-400 uppercase tracking-wider flex items-center gap-1"><Tag className="h-3 w-3" /> Tags</span>
                  <div className="flex flex-wrap gap-1.5">
                    {c.tags && c.tags.length > 0 ? c.tags.map((t: string) => (
                      <Badge key={t} variant="outline" className="text-[10px] font-medium bg-gray-50">{t}</Badge>
                    )) : <span className="text-xs text-gray-300">No tags used</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ─── LIST VIEW ────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader title="Staff Contacts CRM" description="Holistic constituency relationship management">
        <Button onClick={() => { setForm(INITIAL_FORM); setViewMode("wizard"); setWizardStep(1); }} className="shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" /> Add Premium Contact
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Network" value={contacts.length} icon={<Users className="h-5 w-5 text-blue-600" />} />
        <StatCard title="VIP Contacts" value={contacts.filter(c => c.is_vip).length} icon={<Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />} />
        {Object.entries(categoryCounts).slice(0, 2).map(([cat, count]) => (
          <StatCard key={cat} title={cat} value={count as number} />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pb-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            className="pl-10 h-11 bg-white border-gray-200" 
            placeholder="Search by name, organization, phone..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
          />
        </div>
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-44 h-11 bg-white border-gray-200"><SelectValue placeholder="All Categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><LoadingSpinner /></div>
      ) : filtered.length === 0 ? (
        <EmptyState 
          icon={<Users className="h-16 w-16 text-gray-200" />} 
          title="No contacts found" 
          description="Try adjusting your search or filters to find what you are looking for."
          action={<Button variant="outline" onClick={() => { setSearchQuery(""); setCategoryFilter("ALL"); }}>Clear Filters</Button>} 
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c) => (
            <Card 
              key={c.id} 
              className="group border-none shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden bg-white hover:-translate-y-1"
              onClick={() => { setSelected(c); setViewMode("detail"); }}
            >
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${
                    c.is_vip ? "bg-yellow-50 text-yellow-600 border border-yellow-100" : "bg-blue-50 text-blue-600"
                  }`}>
                    {(c.fullName || c.full_name || "?")[0]}
                  </div>
                  <div className="flex gap-1">
                    {c.is_vip && <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />}
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-gray-50 text-gray-500 border-none">{c.category || "General"}</Badge>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">{c.fullName || c.full_name}</h3>
                  <p className="text-xs text-gray-500 font-medium truncate">{c.designation || "No designation"}</p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-50 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Building2 className="h-3 w-3" /> <span className="truncate">{c.organization || "Independent"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MapPin className="h-3 w-3" /> <span className="truncate">{c.village?.name || c.village || c.district?.name || c.district || "No location set"}</span>
                  </div>
                </div>
              </CardContent>
              <div className="h-1 w-full bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
