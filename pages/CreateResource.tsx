import React, { useState, useCallback } from 'react';
import { Sparkles, Upload, FileText, CheckCircle, Loader2, PlayCircle, Image as ImageIcon } from 'lucide-react';
import { generateLessonPlan, generateQuiz, analyzeMaterial } from '../services/geminiService';
import { Resource, ResourceType } from '../types';

interface CreateResourceProps {
  onSave: (resource: Resource) => void;
}

enum Mode {
  LESSON = 'LESSON',
  QUIZ = 'QUIZ',
  ANALYSIS = 'ANALYSIS',
}

const CreateResource: React.FC<CreateResourceProps> = ({ onSave }) => {
  const [mode, setMode] = useState<Mode>(Mode.LESSON);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  
  // Form States
  const [topic, setTopic] = useState('');
  const [grade, setGrade] = useState('');
  const [context, setContext] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setResult('');
    let content = '';

    try {
      if (mode === Mode.LESSON) {
        content = await generateLessonPlan(topic, grade, context);
      } else if (mode === Mode.QUIZ) {
        content = await generateQuiz(topic, grade);
      } else if (mode === Mode.ANALYSIS && file) {
        content = await analyzeMaterial(file, context);
      }
      setResult(content);
    } catch (e) {
      setResult(`Error: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!result) return;
    
    const newResource: Resource = {
      id: Date.now().toString(),
      title: topic || (file ? `Analysis: ${file.name}` : 'Untitled Resource'),
      type: mode === Mode.LESSON ? ResourceType.LESSON_PLAN : mode === Mode.QUIZ ? ResourceType.QUIZ : ResourceType.MEDIA_ANALYSIS,
      content: result,
      createdAt: new Date().toISOString(),
      tags: [grade, mode.toLowerCase()].filter(Boolean),
    };

    onSave(newResource);
    // Reset or notify
    alert('Resource Saved to Library!');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto h-screen flex flex-col">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
          <Sparkles className="text-blue-500" />
          Resource Studio
        </h2>
        <p className="text-slate-500 mt-1">Generate high-quality teaching materials using Multimodal AI.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 overflow-hidden">
        {/* Input Panel */}
        <div className="lg:col-span-5 flex flex-col gap-6 bg-white p-6 rounded-xl shadow-sm border border-slate-100 overflow-y-auto">
          {/* Mode Selector */}
          <div className="flex p-1 bg-slate-100 rounded-lg">
            {[
              { id: Mode.LESSON, label: 'Lesson Plan', icon: FileText },
              { id: Mode.QUIZ, label: 'Quiz', icon: CheckCircle },
              { id: Mode.ANALYSIS, label: 'Multimodal', icon: Upload },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                  mode === m.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <m.icon size={16} />
                {m.label}
              </button>
            ))}
          </div>

          {/* Dynamic Inputs */}
          <div className="space-y-4">
            {mode !== Mode.ANALYSIS && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Topic</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Newton's Laws of Motion"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Grade Level</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                  >
                    <option value="">Select Grade</option>
                    <option value="Elementary (K-5)">Elementary (K-5)</option>
                    <option value="Middle School (6-8)">Middle School (6-8)</option>
                    <option value="High School (9-12)">High School (9-12)</option>
                    <option value="University">University</option>
                  </select>
                </div>
              </>
            )}

            {mode === Mode.ANALYSIS && (
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors">
                <input type="file" onChange={handleFileChange} className="hidden" id="file-upload" accept="image/*,audio/*" />
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    {file ? <CheckCircle size={24} /> : <Upload size={24} />}
                  </div>
                  <span className="text-sm font-medium text-slate-700">
                    {file ? file.name : "Upload Image or Audio"}
                  </span>
                  <span className="text-xs text-slate-400">Supported: PNG, JPG, MP3, WAV</span>
                </label>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {mode === Mode.ANALYSIS ? "Instruction / Prompt" : "Additional Context (Optional)"}
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder={mode === Mode.ANALYSIS ? "Explain what this image demonstrates..." : "e.g., Focus on group activities..."}
                rows={4}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || (mode !== Mode.ANALYSIS && !topic) || (mode === Mode.ANALYSIS && !file)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-md"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
              {loading ? "Generating..." : "Generate Resource"}
            </button>
          </div>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-semibold text-slate-700">Preview</h3>
            <div className="flex gap-2">
              <button 
                onClick={handleSave}
                disabled={!result}
                className="px-3 py-1.5 text-sm bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 rounded-md transition-colors disabled:opacity-50"
              >
                Save to Library
              </button>
            </div>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50">
            {result ? (
              <div className="prose prose-slate max-w-none">
                {/* Simple Markdown rendering replacement for demo purposes */}
                {result.split('\n').map((line, i) => {
                  if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mb-4 text-slate-900">{line.replace('# ', '')}</h1>;
                  if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-6 mb-3 text-slate-800">{line.replace('## ', '')}</h2>;
                  if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold mt-4 mb-2 text-slate-800">{line.replace('### ', '')}</h3>;
                  if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc text-slate-700">{line.replace('- ', '')}</li>;
                  if (line.match(/^\d\./)) return <div key={i} className="mb-2 font-medium text-slate-800">{line}</div>;
                  return <p key={i} className="mb-2 text-slate-600 leading-relaxed">{line}</p>;
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <FileText size={32} />
                </div>
                <p>Generated content will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateResource;
