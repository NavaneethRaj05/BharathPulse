import React, { useState, useEffect } from 'react';
import { createComplaint, parseChatMessage } from '../../services/api';
import { detectWard } from '../../services/gis.api';
import toast from 'react-hot-toast';
import {
  X, UploadCloud, MapPin, Zap, Users, Sparkles, Copy, CheckCircle2, GitMerge, ArrowRight, CornerDownRight
} from 'lucide-react';

export const SubmitPanel = ({
  onClose,
  pickedLocation,
  isPickingLocation,
  setIsPickingLocation,
  onResetLocation,
  refreshMapData,
}) => {
  const emptyForm = {
    title: '',
    description: '',
    location: '',
    reporterName: '',
    reporterEmail: '',
    reporterPhone: '',
    latitude: null,
    longitude: null,
    wardId: '',
    wardName: '',
    wardNumber: '',
    zone: '',
  };

  const [formData, setFormData] = useState(emptyForm);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Sync picked location coordinates
  useEffect(() => {
    if (pickedLocation) {
      setFormData((prev) => ({
        ...prev,
        latitude: Number(pickedLocation.lat.toFixed(6)),
        longitude: Number(pickedLocation.lng.toFixed(6)),
      }));

      // Detect ward from coordinates
      detectWard(pickedLocation.lat, pickedLocation.lng)
        .then((res) => {
          if (res.success && res.found) {
            setFormData((prev) => ({
              ...prev,
              wardId: res.data.ward.id,
              wardName: res.data.ward.name,
              wardNumber: res.data.ward.number,
              zone: res.data.zone,
            }));
            toast.success(`Location matched to ${res.data.ward.name} ward`);
          } else {
            setFormData((prev) => ({
              ...prev,
              wardId: '',
              wardName: '',
              wardNumber: '',
              zone: '',
            }));
            toast.error('Location is outside operational ward boundaries.');
          }
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }, [pickedLocation]);

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be 5MB or smaller.');
      e.target.value = '';
      return;
    }
    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleChatAssist = async () => {
    if (!chatInput.trim()) {
      toast.error('Enter complaint description for AI assist');
      return;
    }
    setChatLoading(true);
    try {
      const res = await parseChatMessage(chatInput.trim());
      if (res.success) {
        const parsed = res.data;
        setFormData((prev) => ({
          ...prev,
          title: parsed.title || prev.title,
          description: parsed.description || prev.description,
          location: parsed.location || prev.location,
        }));
        toast.success('AI filled complaint details');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'AI assist failed');
    } finally {
      setChatLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) return toast.error('Title is required');
    if (!formData.description) return toast.error('Description is required');
    if (!formData.location) return toast.error('Location is required');
    if (!formData.reporterName) return toast.error('Your name is required');
    if (!formData.reporterEmail && !formData.reporterPhone) {
      return toast.error('At least one of Email or Phone is required');
    }

    setLoading(true);
    try {
      const contactInfo = [formData.reporterEmail, formData.reporterPhone].filter(Boolean).join(' | ');
      const submissionData = { ...formData, reporterContact: contactInfo };
      delete submissionData.reporterEmail;
      delete submissionData.reporterPhone;

      const data = new FormData();
      Object.entries(submissionData).forEach(([k, v]) => {
        if (v !== null) data.append(k, v);
      });
      if (image) data.append('image', image);

      const res = await createComplaint(data);
      if (res.success) {
        setResult(res);
        toast.success(res.isDuplicate ? 'Merged with existing complaint!' : 'Incident reported successfully');
        if (refreshMapData) refreshMapData();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setResult(null);
    setFormData(emptyForm);
    setImage(null);
    setImagePreview(null);
    setChatInput('');
    if (onResetLocation) onResetLocation();
  };

  if (result) {
    const { data, similarityScore, alreadyReported } = result;
    return (
      <div className="flex flex-col h-full select-none">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <span className="text-sm font-black text-white uppercase tracking-wider">Report Result</span>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 text-center">
          {result.isDuplicate ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-amber-500/10 rounded-full border border-amber-500/20 text-amber-400">
                  <GitMerge className="w-12 h-12" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white">
                {alreadyReported ? 'Already Reported!' : 'Report Merged!'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                {alreadyReported
                  ? 'You have already reported this issue. Use the ID below to track it.'
                  : `AI detected a ${Math.round(similarityScore * 100)}% match and merged this into an existing open ticket.`}
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-xs font-bold">
                <Users className="w-3.5 h-3.5" />
                {data.reportCount} reporting citizens
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white">Report Registered!</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Incident classified as <span className="font-bold text-slate-200">{data.category}</span> and routed to the corresponding department.
              </p>
            </div>
          )}

          <div className="bg-slate-900 border border-white/5 p-4 rounded-xl mt-6 text-left shadow-inner">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Tracking Code</span>
            <div className="flex items-center justify-between bg-slate-950 px-3 py-2 rounded-lg border border-white/5">
              <code className="text-indigo-400 font-mono text-sm break-all font-bold">{data.complaintCode || data._id}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(data.complaintCode || data._id);
                  toast.success('Copied to clipboard');
                }}
                className="p-1.5 bg-slate-800 rounded hover:bg-indigo-600 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-8">
            <button
              onClick={resetForm}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer text-xs uppercase tracking-wider"
            >
              Report Another Issue
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-300 rounded-xl transition-colors cursor-pointer text-xs"
            >
              Back to Command Center
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full select-none">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <span className="text-sm font-black text-white uppercase tracking-wider">Report Incident</span>
        <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Chat Assist */}
        <div className="bg-slate-900/50 border border-white/5 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/10" />
            <span className="text-[10px] font-bold text-slate-200 uppercase tracking-wider">AI Fast Report Assist</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Broken pipe leaking water in Indiranagar main street..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleChatAssist}
              disabled={chatLoading}
              className="px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
            >
              {chatLoading ? 'Loading...' : 'Fill'}
              <Zap className="w-3 h-3 fill-white" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Map Pin Pick instruction */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">1. Incident Coordinates</span>
            
            <button
              type="button"
              onClick={() => setIsPickingLocation(!isPickingLocation)}
              className={`w-full flex items-center justify-center gap-2 border px-4 py-3 rounded-xl transition-all font-bold cursor-pointer text-xs ${
                isPickingLocation
                  ? 'bg-rose-950/40 border-rose-500/50 text-rose-400'
                  : formData.latitude
                  ? 'bg-slate-900 border-white/10 text-emerald-400 hover:border-white/20'
                  : 'bg-indigo-950/20 border-indigo-500/30 text-indigo-300 hover:bg-indigo-950/30'
              }`}
            >
              <MapPin className={`w-4 h-4 ${isPickingLocation ? 'animate-bounce' : ''}`} />
              {isPickingLocation
                ? 'CLICK MAP TO PIN LOCATION'
                : formData.latitude
                ? `PINNED: ${formData.latitude}, ${formData.longitude}`
                : 'PIN LOCATION ON MAP *'}
            </button>
            {formData.wardName && (
              <div className="text-[10px] font-medium text-slate-400 flex items-center gap-1 pl-1">
                <CornerDownRight className="w-3 h-3 text-indigo-400" />
                Detected: <span className="text-white font-bold">{formData.wardName} Ward ({formData.wardNumber})</span>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">2. Incident Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Large Road Pothole"
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">3. Incident Details *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="Describe the problem, severity, etc."
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Location Text */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">4. Street Address / Landmark *</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. Near HDFC Bank, 12th Main Road"
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Reporter Information */}
          <div className="p-3 bg-slate-900/40 border border-white/5 rounded-xl space-y-3">
            <div className="flex items-center gap-1.5 border-b border-white/5 pb-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Reporter Contact</span>
            </div>

            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Full Name *</label>
              <input
                type="text"
                name="reporterName"
                value={formData.reporterName}
                onChange={handleChange}
                placeholder="Enter your name"
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Email</label>
                <input
                  type="email"
                  name="reporterEmail"
                  value={formData.reporterEmail}
                  onChange={handleChange}
                  placeholder="name@mail.com"
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Phone</label>
                <input
                  type="text"
                  name="reporterPhone"
                  value={formData.reporterPhone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <span className="text-[8px] font-medium text-slate-500 block leading-tight">
              * Provide email or phone to receive SMS/Email alerts on status updates.
            </span>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">5. Attach Evidence Image</label>
            <div className="flex items-center gap-3">
              <label className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/15 hover:border-white/25 hover:bg-slate-900/60 rounded-xl p-3.5 transition-colors cursor-pointer select-none">
                <UploadCloud className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-[10px] font-bold text-slate-300">Upload Photo</span>
                <span className="text-[8px] text-slate-500 mt-0.5">JPEG, PNG up to 5MB</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
              
              {imagePreview && (
                <div className="w-16 h-16 rounded-xl border border-white/10 overflow-hidden shrink-0 shadow-inner relative">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setImage(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-0.5 right-0.5 p-0.5 bg-black/75 hover:bg-black rounded text-white cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-1.5 transition-colors"
          >
            {loading ? 'Submitting Report...' : 'File Official Report'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SubmitPanel;
