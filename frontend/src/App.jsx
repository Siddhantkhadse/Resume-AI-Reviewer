import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import html2pdf from 'html2pdf.js';
import { UploadCloud, FileText, History, Loader2, Sparkles, CheckCircle2, RefreshCw, Sun, Moon, Wand2, Download } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';

function App() {
  const [file, setFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [history, setHistory] = useLocalStorage('resume-history', []);
  const [isDragging, setIsDragging] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewrittenResume, setRewrittenResume] = useState('');
  const [template, setTemplate] = useState('modern');
  const [isExporting, setIsExporting] = useState(false);

  const resumeRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setStreamedText('');
    
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/review/analyze`, {
        method: 'POST',
        body: formData,
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResult = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') break;
            
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                fullResult += parsed.text;
                setStreamedText(fullResult);
              }
            } catch (e) {
              console.error("Parse error chunk", e);
            }
          }
        }
      }

      // Save to history once done
      setHistory([{ id: Date.now(), name: file.name, result: fullResult }, ...history]);
    } catch (error) {
      console.error("Analysis Error:", error);
      setStreamedText('Error connecting to the AI Server. Please check the backend console.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRewrite = async () => {
    if (!file) return;
    setIsRewriting(true);
    setRewrittenResume('');
    
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/review/rewrite`, {
        method: 'POST',
        body: formData,
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResult = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') break;
            
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                fullResult += parsed.text;
                setRewrittenResume(fullResult);
              }
            } catch (e) {
              console.error("Parse error chunk", e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Rewrite failed:', error);
      setRewrittenResume('Error connecting to the AI Server for rewrite.');
    } finally {
      setIsRewriting(false);
    }
  };

  const downloadPDF = () => {
    setIsExporting(true);
    
    setTimeout(() => {
      try {
        const opt = {
          margin:       [20, 0, 20, 0],
          filename:     'ATS_Optimized_Resume.pdf',
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak:    { mode: ['css', 'legacy'], avoid: ['h1', 'h2', 'h3', 'h4', 'p', 'li', 'ul'] }
        };

        html2pdf()
          .set(opt)
          .from(resumeRef.current)
          .save()
          .then(() => {
            setIsExporting(false);
          })
          .catch((error) => {
            console.error("PDF Generation Error:", error);
            setIsExporting(false);
          });
      } catch (error) {
        console.error("Setup Error:", error);
        setIsExporting(false);
      }
    }, 150);
  };

  const downloadDOCX = () => {
    if (!resumeRef.current) return;
    const htmlContent = resumeRef.current.innerHTML;
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + htmlContent + footer;

    const blob = new Blob(['\ufeff', sourceHTML], {
      type: 'application/msword'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ATS_Optimized_Resume.doc';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getTemplateClasses = (tpl) => {
    const spacingOverrides = 'text-[11pt] prose-p:my-1 prose-headings:mt-3 prose-headings:mb-1 prose-ul:my-1 prose-ul:mb-4 prose-li:my-0 prose-hr:my-2 leading-snug prose-headings:break-after-avoid prose-headings:break-inside-avoid prose-p:break-inside-avoid prose-li:break-inside-avoid prose-ul:break-inside-avoid';
    switch (tpl) {
      case 'classic':
        return `prose prose-stone max-w-none prose-headings:text-stone-900 prose-headings:font-serif font-serif ${spacingOverrides}`;
      case 'minimalist':
        return `prose prose-zinc max-w-none prose-headings:text-black prose-headings:font-mono font-mono ${spacingOverrides}`;
      case 'modern':
      default:
        return `prose prose-slate max-w-none prose-headings:text-blue-700 prose-headings:font-sans font-sans ${spacingOverrides}`;
    }
  };

  const selectHistoryItem = (item) => {
    setStreamedText(item.result);
  };

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-blue-500/30 selection:text-blue-600 dark:selection:text-blue-200 transition-colors duration-300">
        
        {/* Sidebar with Ultra-Modern Glassmorphism */}
        <aside className="w-72 bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border-r border-slate-200 dark:border-white/10 p-5 hidden md:flex flex-col justify-between shadow-xl z-10 transition-colors duration-300">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 mb-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-300 dark:to-purple-400 bg-clip-text text-transparent tracking-wide">
              <Sparkles className="text-blue-500 dark:text-blue-400 animate-pulse" size={22} /> AI Reviewer
            </h2>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
              <History size={15} /> Past Reviews
            </div>
            <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[calc(100vh-180px)] pr-1">
              {history.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 italic p-3 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">No past reviews yet</p>
              ) : (
                history.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => selectHistoryItem(item)}
                    className="group p-3 bg-slate-100/80 dark:bg-slate-900/40 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 backdrop-blur-md rounded-xl cursor-pointer border border-slate-200/50 dark:border-white/5 hover:border-blue-500/30 transition-all duration-300 shadow-sm"
                  >
                    <p className="text-sm truncate font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.name}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{new Date(item.id).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Powered by Gemini 3.5</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 relative">
          {/* Background Glow Spheres */}
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-500/10 dark:bg-purple-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Header with Theme Toggle */}
            <header className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-300 dark:to-purple-400 bg-clip-text text-transparent">
                  Resume ATS Analyzer
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">Upload your PDF resume to receive instant, recruiter-grade ATS scoring & optimization suggestions.</p>
              </div>

              {/* Theme Toggle Button */}
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:scale-105 transition-all duration-200 shadow-md backdrop-blur-md flex items-center justify-center shrink-0"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-indigo-600" />}
              </button>
            </header>

            {/* Interactive Dropzone with Glassmorphism */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`group relative border-2 border-dashed transition-all duration-300 rounded-2xl p-8 sm:p-12 bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border-slate-300 dark:border-white/10 flex flex-col items-center justify-center text-center shadow-xl ${
                isDragging 
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-[0_0_25px_rgba(96,165,250,0.4)]' 
                  : 'hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-[0_0_20px_rgba(96,165,250,0.3)]'
              }`}
            >
              <input type="file" id="resume-upload" className="hidden" accept=".pdf" onChange={handleFileChange} />
              <label htmlFor="resume-upload" className="cursor-pointer flex flex-col items-center gap-5 w-full">
                <div className="p-5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl shadow-md border border-slate-200 dark:border-white/10 transition-transform duration-300 group-hover:scale-105 group-hover:border-blue-500/50">
                  <UploadCloud size={48} className="text-blue-600 dark:text-blue-400 transition-all duration-300 group-hover:scale-110 group-hover:animate-pulse" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                    {file ? file.name : "Click or drag your PDF resume here"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">PDF documents up to 5MB are supported.</p>
                </div>
              </label>

              {file && (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button 
                    onClick={handleAnalyze} 
                    disabled={isAnalyzing || isRewriting}
                    className={`px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:scale-105 text-white rounded-xl font-semibold transition-all duration-300 flex items-center gap-2.5 shadow-lg hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isAnalyzing ? 'animate-pulse' : ''
                    }`}
                  >
                    {isAnalyzing ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <FileText size={20} />
                    )}
                    <span>{isAnalyzing ? 'Analyzing Resume...' : 'Generate Review'}</span>
                  </button>

                  <button
                    onClick={() => { setFile(null); setStreamedText(''); setRewrittenResume(''); }}
                    disabled={isAnalyzing || isRewriting}
                    className="p-3.5 bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl border border-slate-200 dark:border-white/10 hover:scale-105 transition-all duration-200"
                    title="Reset file selection"
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>
              )}
            </div>

            {/* Results Stream Area with Markdown Typography */}
            {(streamedText || isAnalyzing) && (
              <section className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl relative min-h-[300px] transition-all duration-500">
                <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4 mb-6 gap-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    <Sparkles className="text-blue-500 dark:text-blue-400" size={20} /> AI Feedback & ATS Insights
                  </h3>
                  {isAnalyzing ? (
                    <div className="flex items-center gap-2 text-xs font-mono text-blue-600 dark:text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                      <span className="h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400 animate-ping" />
                      Streaming AI Analysis...
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      <CheckCircle2 size={14} /> Analysis Complete
                    </div>
                  )}
                </div>

                <div className="prose prose-slate dark:prose-invert max-w-none leading-relaxed">
                  {streamedText ? (
                    <ReactMarkdown>{streamedText}</ReactMarkdown>
                  ) : (
                    isAnalyzing && (
                      <span className="text-slate-400 animate-pulse flex items-center gap-2 font-mono text-sm">
                        Reading PDF document and consulting AI model...
                      </span>
                    )
                  )}
                </div>

                {/* Create ATS-Friendly Resume Action Button */}
                {streamedText && !isAnalyzing && (
                  <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10 flex justify-end">
                    <button
                      onClick={handleRewrite}
                      disabled={isRewriting || !file}
                      className={`px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl font-semibold transition-all duration-300 flex items-center gap-2.5 shadow-lg hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        isRewriting ? 'animate-pulse' : ''
                      }`}
                    >
                      {isRewriting ? <Loader2 className="animate-spin" size={19} /> : <Wand2 size={19} />}
                      <span>{isRewriting ? 'Generating Resume...' : 'Create ATS-Friendly Resume'}</span>
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* Rewritten ATS Resume Section with A4 Paper Preview */}
            {(rewrittenResume || isRewriting) && (
              <section className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl relative min-h-[300px] transition-all duration-500">
                <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4 mb-6 gap-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    <Wand2 className="text-emerald-500 dark:text-emerald-400" size={20} /> Rewritten ATS-Optimized Resume
                  </h3>
                  {isRewriting ? (
                    <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
                      Generating ATS Rewrite...
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      <CheckCircle2 size={14} /> Resume Ready
                    </div>
                  )}
                </div>

                {/* Template Selector Control Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-3 bg-slate-100/80 dark:bg-slate-800/60 backdrop-blur-md rounded-xl border border-slate-200 dark:border-white/10">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Select Template Style:
                  </span>
                  <div className="flex items-center gap-2">
                    {[
                      { id: 'modern', label: 'Modern' },
                      { id: 'classic', label: 'Classic' },
                      { id: 'minimalist', label: 'Minimalist' }
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTemplate(t.id)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                          template === t.id
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scrollable Container with Strict A4 Paper Preview */}
                <div className="overflow-x-auto bg-slate-100 dark:bg-slate-800 p-4 rounded-xl">
                  <div
                    ref={resumeRef}
                    style={!isExporting ? { backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent calc(297mm - 20mm), #f1f5f9 calc(297mm - 20mm), #f1f5f9 297mm)' } : {}}
                    className={`w-[210mm] min-h-[297mm] bg-white text-black mx-auto shadow-2xl box-border overflow-hidden px-[15mm] ${isExporting ? 'py-0' : 'py-[15mm]'}`}
                  >
                    <div className={getTemplateClasses(template)}>
                      {rewrittenResume ? (
                        <ReactMarkdown>{rewrittenResume}</ReactMarkdown>
                      ) : (
                        isRewriting && (
                          <span className="text-slate-400 animate-pulse flex items-center gap-2 font-mono text-sm">
                            Rewriting resume into quantifiable ATS format...
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Download Action Buttons */}
                {rewrittenResume && !isRewriting && (
                  <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-end gap-3">
                    <button
                      onClick={downloadPDF}
                      className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-medium border border-slate-300 dark:border-slate-700 transition-all flex items-center gap-2 text-sm shadow-sm cursor-pointer hover:scale-105 active:scale-95"
                    >
                      <Download size={16} />
                      <span>Download as PDF</span>
                    </button>
                    <button
                      onClick={downloadDOCX}
                      className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-medium border border-slate-300 dark:border-slate-700 transition-all flex items-center gap-2 text-sm shadow-sm cursor-pointer hover:scale-105 active:scale-95"
                    >
                      <FileText size={16} />
                      <span>Download as DOCX</span>
                    </button>
                  </div>
                )}
              </section>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

export default App;






