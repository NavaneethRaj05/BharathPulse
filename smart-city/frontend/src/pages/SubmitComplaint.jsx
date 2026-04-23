import React, { useState } from 'react';
import { createComplaint } from '../services/api';
import toast from 'react-hot-toast';
import {
  UploadCloud, CheckCircle2, Copy, ArrowRight, Loader2,
  ImagePlus, FileText, Users, GitMerge, AlertTriangle, Zap, MapPin
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, staggerItem, buttonTap, successPop, shakeVariants } from '../animations/variants';

/* ── Live ML category preview ─────────────────────────────────────────── */
const CATEGORY_KEYWORDS = {
  Sanitation:         { high: ['garbage','waste','trash','sewage','dump','litter','rubbish'], color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  Roads:              { high: ['pothole','road','highway','pavement','asphalt','crack','bump'], color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  'Water Department': { high: ['water','leak','pipe','flood','sewage','supply','drainage'], color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  Electrical:         { high: ['electricity','electric','power','light','streetlight','outage','wire'], color: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
};

function liveCategory(text) {
  const t = text.toLowerCase();
  for (const [cat, { high }] of Object.entries(CATEGORY_KEYWORDS)) {
    if (high.some(k => t.includes(k))) return cat;
  }
  return null;
}

/* ── Duplicate-merged success screen ─────────────────────────────────── */
const MergedSuccess = ({ data, score, alreadyReported, onReset }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.93 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    className="max-w-2xl mx-auto mt-10 bg-gray-800/80 backdrop-blur-xl p-10 rounded-[2.5rem] border border-amber-500/30 shadow-2xl text-center relative overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-b from-amber-500/8 to-transparent pointer-events-none" />

    <motion.div {...successPop} className="flex justify-center mb-6">
      <div className="p-4 bg-amber-500/20 rounded-full shadow-[0_0_40px_rgba(245,158,11,0.3)]">
        <GitMerge className="w-16 h-16 text-amber-400" />
      </div>
    </motion.div>

    <h2 className="text-3xl font-black mb-3">
      {alreadyReported ? 'Already Reported!' : 'Report Merged!'}
    </h2>
    <p className="text-gray-400 mb-2 text-lg max-w-md mx-auto">
      {alreadyReported
        ? 'You have already reported this complaint. Use the ID below to track it.'
        : `Our AI found a ${Math.round(score * 100)}% similar existing complaint and merged your report into it.`}
    </p>
    <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-4 py-2 rounded-full text-sm font-bold mb-8">
      <Users className="w-4 h-4" />
      {data.reportCount} {data.reportCount === 1 ? 'person has' : 'people have'} reported this issue
    </div>

    <div className="bg-gray-900/80 p-6 rounded-3xl border border-gray-700 mb-8 shadow-inner">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Complaint ID</p>
      <div className="flex items-center justify-between bg-gray-800 border border-gray-600 p-4 rounded-2xl">
        <code className="text-blue-400 font-mono text-lg break-all select-all">{data._id}</code>
        <button onClick={() => { navigator.clipboard.writeText(data._id); toast.success('Copied!'); }}
          className="p-3 bg-gray-700 rounded-xl hover:bg-blue-600 hover:text-white transition-all ml-3 shrink-0">
          <Copy className="w-5 h-5" />
        </button>
      </div>
    </div>

    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Link to="/track">
        <motion.span {...buttonTap} className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/25">
          Track It <ArrowRight className="w-5 h-5" />
        </motion.span>
      </Link>
      <motion.button {...buttonTap} onClick={onReset}
        className="px-8 py-4 bg-gray-700 hover:bg-gray-600 font-bold rounded-2xl transition-all">
        Submit New Report
      </motion.button>
    </div>
  </motion.div>
);

/* ── New complaint success screen ─────────────────────────────────────── */
const NewSuccess = ({ data, onReset }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.92 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    className="max-w-2xl mx-auto mt-10 bg-gray-800/80 backdrop-blur-xl p-10 rounded-[2.5rem] border border-gray-700 shadow-2xl text-center relative overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />
    <motion.div {...successPop} className="flex justify-center mb-8">
      <div className="p-4 bg-emerald-500/20 rounded-full shadow-[0_0_40px_rgba(16,185,129,0.35)]">
        <CheckCircle2 className="w-20 h-20 text-emerald-400" />
      </div>
    </motion.div>
    <h2 className="text-4xl font-black mb-4">Report Received!</h2>
    <p className="text-gray-400 mb-2 text-lg max-w-md mx-auto">
      Your complaint has been ML-categorized as{' '}
      <span className="font-bold text-white">{data.category}</span> and routed to the right department.
    </p>
    {data.mlConfidence > 0 && (
      <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-4 py-2 rounded-full text-sm font-bold mb-8">
        <Zap className="w-4 h-4" />
        AI Confidence: {Math.round(data.mlConfidence * 100)}%
      </div>
    )}
    <div className="bg-gray-900/80 p-8 rounded-3xl border border-gray-700 mb-10 shadow-inner">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Your Tracking ID</p>
      <div className="flex items-center justify-between bg-gray-800 border border-gray-600 p-4 rounded-2xl">
        <code className="text-blue-400 font-mono text-xl break-all select-all">{data._id}</code>
        <button onClick={() => { navigator.clipboard.writeText(data._id); toast.success('Copied!'); }}
          className="p-3 bg-gray-700 rounded-xl hover:bg-blue-600 hover:text-white transition-all ml-3 shrink-0">
          <Copy className="w-5 h-5" />
        </button>
      </div>
    </div>
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Link to="/track">
        <motion.span {...buttonTap} className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/25">
          Track It Now <ArrowRight className="w-5 h-5" />
        </motion.span>
      </Link>
      <motion.button {...buttonTap} onClick={onReset}
        className="px-8 py-4 bg-gray-700 hover:bg-gray-600 font-bold rounded-2xl transition-all">
        Submit Another
      </motion.button>
    </div>
  </motion.div>
);

/* ── Main form ────────────────────────────────────────────────────────── */
const SubmitComplaint = () => {
  const emptyForm = { title: '', description: '', location: '', reporterName: '', reporterContact: '', latitude: null, longitude: null };
  const [formData, setFormData] = useState(emptyForm);
  const [image, setImage]             = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState(null); // { isDuplicate, alreadyReported, data, similarityScore }
  const [shakeField, setShakeField]   = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const predictedCategory = liveCategory(formData.description);

  const handleChange = (e) => setFormData(f => ({ ...f, [e.target.name]: e.target.value }));

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser.');
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(f => ({
          ...f,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
        setLocationLoading(false);
        toast.success('Location captured!');
      },
      (error) => {
        setLocationLoading(false);
        toast.error('Unable to retrieve location: ' + error.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const shake = (field) => { setShakeField(field); setTimeout(() => setShakeField(null), 600); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title)           { shake('title');           toast.error('Title is required');          return; }
    if (!formData.description)     { shake('description');     toast.error('Description is required');    return; }
    if (!formData.location)        { shake('location');        toast.error('Location is required');       return; }
    if (!formData.reporterName)    { shake('reporterName');    toast.error('Your name is required');      return; }
    if (!formData.reporterContact) { shake('reporterContact'); toast.error('Contact info is required');   return; }

    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([k, v]) => data.append(k, v));
      if (image) data.append('image', image);

      const res = await createComplaint(data);
      if (res.success) {
        setResult(res);
        toast.success(res.isDuplicate ? 'Merged with existing complaint!' : 'New complaint filed!');
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
  };

  /* ── Result screens ── */
  if (result) {
    return result.isDuplicate
      ? <MergedSuccess data={result.data} score={result.similarityScore} alreadyReported={result.alreadyReported} onReset={resetForm} />
      : <NewSuccess data={result.data} onReset={resetForm} />;
  }

  /* ── Form ── */
  const Field = ({ name, label, as: As = 'input', ...props }) => (
    <motion.div animate={shakeField === name ? 'shake' : 'idle'} variants={shakeVariants}>
      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</label>
      <As
        name={name}
        value={formData[name]}
        onChange={handleChange}
        className="w-full bg-gray-900 border border-gray-600 rounded-2xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
        {...props}
      />
    </motion.div>
  );

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="max-w-3xl mx-auto">
      <motion.div
        variants={staggerItem}
        className="bg-gray-800/80 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-gray-700 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-[-60px] right-[-60px] w-52 h-52 bg-blue-500/8 rounded-full blur-[80px] pointer-events-none" />

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex p-3 bg-blue-500/20 rounded-2xl mb-4">
            <FileText className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-4xl font-black mb-2 tracking-tight">Report an Issue</h2>
          <p className="text-gray-400 text-lg">Our AI will route it to the right department and detect duplicates automatically.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Reporter info */}
          <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-700/50 space-y-5">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
              <Users className="w-4 h-4 text-blue-400" /> Your Information
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <Field name="reporterName"    label="Full Name *"    placeholder="Jane Doe" />
              <Field name="reporterContact" label="Email / Phone *" placeholder="jane@example.com" />
            </div>
          </div>

          {/* Complaint details */}
          <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-700/50 space-y-5">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
              <FileText className="w-4 h-4 text-blue-400" /> Complaint Details
            </div>

            <Field name="title" label="Title *" placeholder="E.g., Large pothole on Main St" />

            {/* Description + live category */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description *</label>
              <motion.div animate={shakeField === 'description' ? 'shake' : 'idle'} variants={shakeVariants}>
                <textarea
                  name="description" value={formData.description} onChange={handleChange} rows={4}
                  placeholder="Describe the issue. AI will detect category and check for duplicates…"
                  className="w-full bg-gray-900 border border-gray-600 rounded-2xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none font-medium"
                />
              </motion.div>
              <AnimatePresence>
                {predictedCategory && (
                  <motion.div
                    key="cat"
                    initial={{ opacity: 0, y: -6, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-2 flex items-center gap-2"
                  >
                    <Zap className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-xs text-gray-500 font-medium">AI detects:</span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${CATEGORY_KEYWORDS[predictedCategory].color}`}>
                      {predictedCategory}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Field name="location" label="Location *" placeholder="Exact address or landmark" />

            {/* GPS Location */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">GPS Coordinates (Optional)</label>
              <div className="flex gap-3">
                <input
                  type="number" step="any" name="latitude" value={formData.latitude || ''} onChange={handleChange}
                  placeholder="Latitude" className="flex-1 bg-gray-900 border border-gray-600 rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all font-medium"
                />
                <input
                  type="number" step="any" name="longitude" value={formData.longitude || ''} onChange={handleChange}
                  placeholder="Longitude" className="flex-1 bg-gray-900 border border-gray-600 rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all font-medium"
                />
                <motion.button
                  type="button" onClick={getCurrentLocation}
                  disabled={locationLoading}
                  {...buttonTap}
                  className="px-4 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-2"
                >
                  {locationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                  {locationLoading ? 'Getting...' : 'Get GPS'}
                </motion.button>
              </div>
            </div>

            {/* Image */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Photo Evidence (Optional)</label>
              <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-gray-600 border-dashed rounded-3xl cursor-pointer bg-gray-900/80 hover:border-blue-500 hover:bg-gray-800/50 transition-all overflow-hidden relative group">
                <AnimatePresence mode="wait">
                  {imagePreview ? (
                    <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-gray-900/80 p-3 rounded-full backdrop-blur-sm">
                          <ImagePlus className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-center px-4">
                      <div className="p-4 bg-gray-800 rounded-full mb-3 group-hover:bg-blue-500/20 group-hover:scale-110 transition-all shadow-inner">
                        <UploadCloud className="w-7 h-7 text-gray-400 group-hover:text-blue-400 transition-colors" />
                      </div>
                      <p className="text-sm text-gray-300"><span className="text-blue-400 font-bold">Click to upload</span> or drag &amp; drop</p>
                      <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">PNG, JPG, WEBP — Max 5MB</p>
                    </motion.div>
                  )}
                </AnimatePresence>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              </label>
            </div>
          </div>

          {/* AI notice */}
          <div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl text-sm text-gray-400">
            <AlertTriangle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <span>Our AI will check if a similar complaint already exists and <strong className="text-blue-300">merge your report</strong> instead of creating a duplicate — keeping the system clean.</span>
          </div>

          <motion.button
            {...buttonTap}
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black text-lg py-5 px-8 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-blue-500/25"
          >
            {loading ? <><Loader2 className="w-6 h-6 animate-spin" /> Analyzing &amp; Submitting…</> : 'Submit Official Report'}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default SubmitComplaint;
