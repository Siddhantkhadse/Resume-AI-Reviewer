import { useState } from 'react';
import { UploadCloud, FileText, History, Loader2, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';

function App() {
  const [file, setFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [history, setHistory] = useLocalStorage('resume-history', []);
  const [isDragging, setIsDragging] = useState(false);

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
      console.error('Upload failed:', error);
      setStreamedText('Error connecting to the AI Server.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const selectHistoryItem = (item) => {
    setStreamedText(item.result);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans antialiased selection:bg-blue-500/30 selection:text-blue-200">
      {/* Sidebar with Ultra-Modern Glassmorphism */}
      <aside className="w-72 bg-slate-900/50 backdrop-blur-xl border-r border-white/10 p-5 hidden md:flex flex-col justify-between shadow-2xl z-10">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 mb-8 bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent tracking-wide">
            <Sparkles className="text-blue-400 animate-pulse" size={22} /> AI Reviewer
          </h2>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
            <History size={15} className="text-slate-400" /> Past Reviews
          </div>
          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[calc(100vh-180px)] pr-1">
            {history.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 text-center border border-dashed border-slate-800 rounded-lg">No past reviews yet</p>
            ) : (
              history.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => selectHistoryItem(item)}
                  className="group p-3 bg-slate-900/40 hover:bg-slate-800/80 backdrop-blur-md rounded-xl cursor-pointer border border-white/5 hover:border-blue-500/30 transition-all duration-300 shadow-sm"
                >
                  <p className="text-sm truncate font-medium text-slate-200 group-hover:text-blue-400 transition-colors">{item.name}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{new Date(item.id).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 text-xs text-slate-400 flex items-center justify-between">
          <span>Powered by Gemini 1.5</span>
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 relative">
        {/* Background Glow Spheres */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header */}
          <header className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Resume ATS Analyzer
            </h1>
            <p className="text-slate-400 text-sm sm:text-base">Upload your PDF resume to receive instant, recruiter-grade ATS scoring & optimization suggestions.</p>
          </header>

          {/* Interactive Dropzone with Glassmorphism */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`group relative border-2 border-dashed transition-all duration-300 rounded-2xl p-8 sm:p-12 bg-slate-900/50 backdrop-blur-xl border-white/10 flex flex-col items-center justify-center text-center shadow-2xl ${
              isDragging 
                ? 'border-blue-400 bg-blue-950/20 shadow-[0_0_25px_rgba(96,165,250,0.4)]' 
                : 'hover:border-blue-400 hover:shadow-[0_0_20px_rgba(96,165,250,0.3)]'
            }`}
          >
            <input type="file" id="resume-upload" className="hidden" accept=".pdf" onChange={handleFileChange} />
            <label htmlFor="resume-upload" className="cursor-pointer flex flex-col items-center gap-5 w-full">
              <div className="p-5 bg-slate-800/80 rounded-2xl shadow-xl border border-white/10 transition-transform duration-300 group-hover:scale-105 group-hover:border-blue-500/50">
                <UploadCloud size={48} className="text-blue-400 transition-all duration-300 group-hover:scale-110 group-hover:animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-semibold text-slate-200 group-hover:text-blue-300 transition-colors">
                  {file ? file.name : "Click or drag your PDF resume here"}
                </p>
                <p className="text-xs text-slate-400">PDF documents up to 5MB are supported.</p>
              </div>
            </label>

            {file && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button 
                  onClick={handleAnalyze} 
                  disabled={isAnalyzing}
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
                  onClick={() => { setFile(null); setStreamedText(''); }}
                  disabled={isAnalyzing}
                  className="p-3.5 bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded-xl border border-white/10 hover:scale-105 transition-all duration-200"
                  title="Reset file selection"
                >
                  <RefreshCw size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Results Stream Area with Tech Terminal Typography */}
          {(streamedText || isAnalyzing) && (
            <section className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative min-h-[300px] transition-all duration-500">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-100">
                  <Sparkles className="text-blue-400" size={20} /> AI Feedback & ATS Insights
                </h3>
                {isAnalyzing ? (
                  <div className="flex items-center gap-2 text-xs font-mono text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                    <span className="h-2 w-2 rounded-full bg-blue-400 animate-ping" />
                    Streaming AI Analysis...
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    <CheckCircle2 size={14} /> Analysis Complete
                  </div>
                )}
              </div>

              <div className="font-mono text-sm leading-relaxed text-slate-300 whitespace-pre-wrap transition-opacity duration-300">
                {streamedText}
                {isAnalyzing && !streamedText && (
                  <span className="text-slate-400 animate-pulse flex items-center gap-2">
                    Reading PDF document and consulting AI model...
                  </span>
                )}
              </div>
            </section>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;


