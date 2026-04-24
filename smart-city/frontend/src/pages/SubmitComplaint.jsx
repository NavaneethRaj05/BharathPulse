import React, { useEffect, useRef, useState } from 'react';
import { askFaqMessage, createComplaint, parseChatMessage } from '../services/api';
import toast from 'react-hot-toast';
import {
  UploadCloud, CheckCircle2, Copy, ArrowRight, Loader2,
  ImagePlus, FileText, Users, GitMerge, AlertTriangle, Zap, MapPin, Bot, MessageCircleQuestion, Sparkles, X
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

const Field = ({ name, label, formData, handleChange, shakeField, id, inputRef, as: As = 'input', ...props }) => (
  <motion.div animate={shakeField === name ? 'shake' : 'idle'} variants={shakeVariants}>
    <label htmlFor={id || name} className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 cursor-text">
      {label}
    </label>
    <As
      ref={inputRef}
      id={id || name}
      name={name}
      value={formData[name]}
      onChange={handleChange}
      className="w-full bg-gray-900 border border-gray-600 rounded-2xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
      {...props}
    />
  </motion.div>
);

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
        <code className="text-blue-400 font-mono text-lg break-all select-all">{data.complaintCode || data._id}</code>
        <button onClick={() => { navigator.clipboard.writeText(data.complaintCode || data._id); toast.success('Copied!'); }}
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
        <code className="text-blue-400 font-mono text-xl break-all select-all">{data.complaintCode || data._id}</code>
        <button onClick={() => { navigator.clipboard.writeText(data.complaintCode || data._id); toast.success('Copied!'); }}
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
  const emptyForm = { title: '', description: '', location: '', reporterName: '', reporterEmail: '', reporterPhone: '', latitude: null, longitude: null };
  const [formData, setFormData] = useState(emptyForm);
  const [image, setImage]             = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState(null); // { isDuplicate, alreadyReported, data, similarityScore }
  const [shakeField, setShakeField]   = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatReply, setChatReply] = useState('');
  const [chatParsed, setChatParsed] = useState(null);
  const [enhancerOpen, setEnhancerOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [faqLoading, setFaqLoading] = useState(false);
  const [faqInput, setFaqInput] = useState('');
  const [faqMessages, setFaqMessages] = useState([
    {
      role: 'bot',
      text: 'Hi! I am your FAQ assistant. Ask me about tracking complaints, IDs, categories, uploads, or status updates.',
    },
  ]);
  const nameInputRef = useRef(null);
  const contactInputRef = useRef(null);

  const predictedCategory = liveCategory(formData.description);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const handleChange = (e) => setFormData(f => ({ ...f, [e.target.name]: e.target.value }));

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser.');
      return;
    }

    if (!window.isSecureContext) {
      toast.error('GPS requires a secure context (https or localhost).');
      return;
    }

    const showGeoError = (error) => {
      switch (error.code) {
        case 1:
          toast.error('Location permission denied. Allow location access in browser settings.');
          break;
        case 2:
          toast.error('Location unavailable. Turn on device location/GPS and try again.');
          break;
        case 3:
          toast.error('Location request timed out. Retrying with lower accuracy...');
          break;
        default:
          toast.error(`Unable to retrieve location: ${error.message}`);
      }
    };

    const applyCoords = (position) => {
      setFormData(f => ({
        ...f,
        latitude: Number(position.coords.latitude.toFixed(6)),
        longitude: Number(position.coords.longitude.toFixed(6))
      }));
      setLocationLoading(false);
      toast.success('Location captured!');
    };

    const fallbackRequest = () => {
      navigator.geolocation.getCurrentPosition(
        applyCoords,
        (error) => {
          setLocationLoading(false);
          showGeoError(error);
        },
        { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 }
      );
    };

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      applyCoords,
      (error) => {
        if (error.code === 3) {
          fallbackRequest();
          return;
        }
        setLocationLoading(false);
        showGeoError(error);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error('Image must be 5MB or smaller.');
      e.target.value = '';
      return;
    }
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
    if (!formData.reporterEmail && !formData.reporterPhone) { 
      shake('reporterEmail'); shake('reporterPhone'); 
      toast.error('At least one of Email or Phone is required'); 
      return; 
    }

    setLoading(true);
    try {
      const contactInfo = [formData.reporterEmail, formData.reporterPhone].filter(Boolean).join(' | ');
      const submissionData = { ...formData, reporterContact: contactInfo };
      delete submissionData.reporterEmail;
      delete submissionData.reporterPhone;

      const data = new FormData();
      Object.entries(submissionData).forEach(([k, v]) => data.append(k, v));
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

  const handleChatAssist = async () => {
    if (!chatInput.trim()) {
      toast.error('Enter a short complaint message for chatbot assist');
      return;
    }
    setChatLoading(true);
    try {
      const res = await parseChatMessage(chatInput.trim());
      if (res.success) {
        const parsed = res.data;
        setFormData((prev) => ({
          ...prev,
          // Force-apply chatbot output so users always see autofill happen.
          title: parsed.title || prev.title,
          description: parsed.description || prev.description,
          location: parsed.location || prev.location,
        }));
        setChatParsed(parsed);
        setChatReply(parsed.botReply);
        toast.success('Autofilled complaint details from chatbot');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Chat assist failed');
    } finally {
      setChatLoading(false);
    }
  };

  const resetForm = () => {
    setResult(null);
    setFormData(emptyForm);
    setImage(null);
    setImagePreview(null);
  };

  const handleFaqSend = async () => {
    const message = faqInput.trim();
    if (!message || faqLoading) return;

    setFaqMessages((prev) => [...prev, { role: 'user', text: message }]);
    setFaqInput('');
    setFaqLoading(true);
    try {
      const res = await askFaqMessage(message);
      const answer = res?.data?.answer || 'Sorry, I could not fetch an answer right now.';
      setFaqMessages((prev) => [...prev, { role: 'bot', text: answer }]);
    } catch (err) {
      setFaqMessages((prev) => [
        ...prev,
        { role: 'bot', text: err.response?.data?.error || 'FAQ service is temporarily unavailable.' },
      ]);
    } finally {
      setFaqLoading(false);
    }
  };

  /* ── Result screens ── */
  if (result) {
    return result.isDuplicate
      ? <MergedSuccess data={result.data} score={result.similarityScore} alreadyReported={result.alreadyReported} onReset={resetForm} />
      : <NewSuccess data={result.data} onReset={resetForm} />;
  }

  /* ── Form ── */

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="max-w-3xl mx-auto">
      <motion.div
        variants={staggerItem}
        className="bg-gray-800/80 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-gray-700/60 shadow-[0_8px_60px_rgba(0,0,0,0.5)] relative overflow-hidden"
      >
        {/* Decorative blobs */}
        <div className="absolute top-[-60px] right-[-60px] w-60 h-60 bg-blue-500/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute bottom-[-40px] left-[-40px] w-40 h-40 bg-violet-500/8 rounded-full blur-[70px] pointer-events-none" />

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex p-3.5 bg-gradient-to-br from-blue-500/30 to-violet-500/20 rounded-2xl mb-4 shadow-lg shadow-blue-500/10">
            <FileText className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-4xl font-black mb-2 tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Report an Issue</h2>
          <p className="text-gray-400 text-lg">Our AI will route it to the right department and detect duplicates automatically.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Reporter info */}
          <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-700/50 space-y-5">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
              <Users className="w-4 h-4 text-blue-400" /> Your Information
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <Field
                id="reporterName"
                name="reporterName"
                label="Full Name *"
                formData={formData}
                handleChange={handleChange}
                shakeField={shakeField}
                placeholder="Enter full name"
                autoComplete="name"
                inputRef={nameInputRef}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    contactInputRef.current?.focus();
                  }
                }}
              />
              <Field
                id="reporterEmail"
                name="reporterEmail"
                label="Email Address"
                formData={formData}
                handleChange={handleChange}
                shakeField={shakeField}
                placeholder="Enter email address"
                autoComplete="email"
                inputRef={contactInputRef}
              />
              <Field
                id="reporterPhone"
                name="reporterPhone"
                label="Phone Number"
                formData={formData}
                handleChange={handleChange}
                shakeField={shakeField}
                placeholder="Enter phone number"
                autoComplete="tel"
              />
            </div>
          </div>

          {/* Complaint details */}
          <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-700/50 space-y-5">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
              <FileText className="w-4 h-4 text-blue-400" /> Complaint Details
            </div>

            {/* Title field with inline AI enhancer */}
            <motion.div animate={shakeField === 'title' ? 'shake' : 'idle'} variants={shakeVariants}>
              <label htmlFor="title" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 cursor-text">
                Title *
              </label>
              <div className="relative flex items-center">
                <input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter title"
                  className="w-full bg-gray-900 border border-gray-600 rounded-2xl pl-5 pr-14 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                />
                <motion.button
                  type="button"
                  onClick={async () => {
                    if (!formData.title.trim()) {
                      toast.error('Enter a title first — AI will elaborate and fill the form.');
                      return;
                    }
                    setChatInput(formData.title.trim());
                    setChatLoading(true);
                    try {
                      const res = await parseChatMessage(formData.title.trim());
                      if (res.success) {
                        const parsed = res.data;
                        setFormData((prev) => ({
                          ...prev,
                          description: parsed.description || prev.description,
                          location: parsed.location || prev.location,
                        }));
                        setChatParsed(parsed);
                        setChatReply(parsed.botReply);
                        toast.success('✨ AI elaborated your title and filled the form!');
                      }
                    } catch (err) {
                      toast.error(err.response?.data?.error || 'AI enhance failed');
                    } finally {
                      setChatLoading(false);
                    }
                  }}
                  title="AI Enhancer — auto-fill form from title"
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute right-3 flex items-center justify-center w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 hover:border-cyan-400 transition-all"
                >
                  {chatLoading
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Sparkles className="w-3.5 h-3.5" />}
                </motion.button>
              </div>
              {chatParsed && (
                <div className="flex items-center gap-2 mt-2">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span className="text-xs text-cyan-400 font-medium">AI filled description &amp; location from your title</span>
                </div>
              )}
            </motion.div>

            {/* Description + live category */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description *</label>
              <motion.div animate={shakeField === 'description' ? 'shake' : 'idle'} variants={shakeVariants}>
                <textarea
                  name="description" value={formData.description} onChange={handleChange} rows={4}
                  placeholder="Enter description. AI will detect category and check for duplicates…"
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

            <Field
              name="location"
              label="Location *"
              formData={formData}
              handleChange={handleChange}
              shakeField={shakeField}
              placeholder="Enter location"
            />

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
            className="w-full bg-gradient-to-r from-blue-600 via-blue-500 to-violet-600 hover:from-blue-500 hover:via-blue-400 hover:to-violet-500 text-white font-black text-lg py-5 px-8 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 hover:shadow-xl"
          >
            {loading ? <><Loader2 className="w-6 h-6 animate-spin" /> Analyzing &amp; Submitting…</> : <><ArrowRight className="w-5 h-5" /> Submit Official Report</>}
          </motion.button>
        </form>
      </motion.div>

      {/* Floating AI assistant buttons — compact pill style */}
      <div className="fixed bottom-6 right-5 z-40 flex flex-col items-end gap-2.5">
        {/* AI Enhancer FAB */}
        <motion.button
          type="button"
          onClick={() => { setEnhancerOpen((prev) => !prev); setFaqOpen(false); }}
          title="AI Complaint Enhancer"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          className={`group flex items-center gap-2 pl-2.5 pr-3.5 py-2 rounded-full shadow-lg transition-all duration-200 ${
            enhancerOpen
              ? 'bg-cyan-500 shadow-cyan-500/40'
              : 'bg-gray-800/90 border border-cyan-500/40 hover:bg-cyan-600/80 hover:border-cyan-400 shadow-gray-900/50'
          }`}
        >
          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-cyan-500/20 group-hover:bg-cyan-500/30 transition-colors">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
          </span>
          <span className="text-xs font-semibold text-cyan-200 tracking-wide">Enhancer</span>
        </motion.button>

        {/* FAQ Chatbot FAB */}
        <motion.button
          type="button"
          onClick={() => { setFaqOpen((prev) => !prev); setEnhancerOpen(false); }}
          title="FAQ AI Chatbot"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          className={`group flex items-center gap-2 pl-2.5 pr-3.5 py-2 rounded-full shadow-lg transition-all duration-200 ${
            faqOpen
              ? 'bg-violet-500 shadow-violet-500/40'
              : 'bg-gray-800/90 border border-violet-500/40 hover:bg-violet-600/80 hover:border-violet-400 shadow-gray-900/50'
          }`}
        >
          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-violet-500/20 group-hover:bg-violet-500/30 transition-colors">
            <MessageCircleQuestion className="w-3.5 h-3.5 text-violet-300" />
          </span>
          <span className="text-xs font-semibold text-violet-200 tracking-wide">Ask FAQ</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {enhancerOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-40 w-[min(26rem,calc(100vw-2rem))] bg-gray-900/95 border border-cyan-500/30 rounded-3xl p-5 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="flex items-center gap-2 text-sm font-bold text-cyan-300 uppercase tracking-wider">
                <Bot className="w-4 h-4" /> AI Complaint Enhancer
              </p>
              <button type="button" onClick={() => setEnhancerOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              rows={3}
              placeholder="Example: There is a huge pothole near MG Road signal causing accidents."
              className="w-full bg-gray-900 border border-gray-600 rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none font-medium"
            />
            <div className="flex items-center gap-3 mt-3">
              <button
                type="button"
                onClick={handleChatAssist}
                disabled={chatLoading}
                className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 text-white font-bold rounded-2xl transition-all"
              >
                {chatLoading ? 'Analyzing...' : 'Autofill Form'}
              </button>
              {chatReply && <span className="text-xs text-cyan-300 line-clamp-2">{chatReply}</span>}
            </div>
            {chatParsed && (
              <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                <div className="bg-gray-800/90 border border-gray-700 rounded-xl p-2.5">
                  <p className="text-gray-500 uppercase tracking-wider mb-1">Category</p>
                  <p className="text-cyan-200 font-medium">{chatParsed.category || 'General'}</p>
                </div>
                <div className="bg-gray-800/90 border border-gray-700 rounded-xl p-2.5">
                  <p className="text-gray-500 uppercase tracking-wider mb-1">Priority</p>
                  <p className="text-cyan-200 font-medium">{chatParsed.priority || 'Normal'}</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {faqOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-40 w-[min(28rem,calc(100vw-2rem))] bg-gray-900/95 border border-violet-500/30 rounded-3xl p-5 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="flex items-center gap-2 text-sm font-bold text-violet-300 uppercase tracking-wider">
                <MessageCircleQuestion className="w-4 h-4" /> FAQ AI Chatbot
              </p>
              <button type="button" onClick={() => setFaqOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="h-56 overflow-y-auto rounded-2xl border border-gray-700 bg-gray-900/70 p-3 space-y-2">
              {faqMessages.map((msg, index) => (
                <div
                  key={`${msg.role}-${index}`}
                  className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm ${msg.role === 'user' ? 'ml-auto bg-violet-600 text-white' : 'bg-gray-800 text-gray-200 border border-gray-700'}`}
                >
                  {msg.text}
                </div>
              ))}
              {faqLoading && <p className="text-xs text-violet-300">Typing...</p>}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <input
                type="text"
                value={faqInput}
                onChange={(e) => setFaqInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleFaqSend();
                  }
                }}
                placeholder="Ask FAQ: How do I track status?"
                className="flex-1 bg-gray-900 border border-gray-600 rounded-2xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
              <button
                type="button"
                onClick={handleFaqSend}
                disabled={faqLoading || !faqInput.trim()}
                className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-600 text-white font-bold rounded-2xl transition-all"
              >
                Send
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SubmitComplaint;
