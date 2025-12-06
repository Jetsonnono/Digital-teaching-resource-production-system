import React, { useState } from 'react';
import { Resource, ResourceType } from '../types';
import { Search, FileText, CheckCircle, Image as ImageIcon, Video, Trash2, Eye, X } from 'lucide-react';

interface LibraryProps {
  resources: Resource[];
  onDelete: (id: string) => void;
}

const Library: React.FC<LibraryProps> = ({ resources, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<string>('ALL');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'ALL' || r.type === filter;
    return matchesSearch && matchesFilter;
  });

  const getIcon = (type: ResourceType) => {
    switch(type) {
      case ResourceType.LESSON_PLAN: return <FileText className="text-blue-500" />;
      case ResourceType.QUIZ: return <CheckCircle className="text-green-500" />;
      case ResourceType.MEDIA_ANALYSIS: return <ImageIcon className="text-purple-500" />;
      default: return <FileText className="text-slate-500" />;
    }
  };

  // Helper to render simple markdown-like content
  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mb-4 text-slate-900">{line.replace('# ', '')}</h1>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-6 mb-3 text-slate-800">{line.replace('## ', '')}</h2>;
      if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold mt-4 mb-2 text-slate-800">{line.replace('### ', '')}</h3>;
      if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc text-slate-700">{line.replace('- ', '')}</li>;
      if (line.match(/^\d\./)) return <div key={i} className="mb-2 font-medium text-slate-800">{line}</div>;
      return <p key={i} className="mb-2 text-slate-600 leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="p-8">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">My Library</h2>
          <p className="text-slate-500 mt-1">Manage and organize your generated teaching materials.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search resources..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-64"
            />
          </div>
        </div>
      </header>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['ALL', ResourceType.LESSON_PLAN, ResourceType.QUIZ, ResourceType.MEDIA_ANALYSIS].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f 
                ? 'bg-slate-800 text-white' 
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f === 'ALL' ? 'All Resources' : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.length > 0 ? (
          filteredResources.map((resource) => (
            <div key={resource.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    {getIcon(resource.type)}
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {new Date(resource.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-slate-800 mb-2 line-clamp-2">{resource.title}</h3>
                <p className="text-slate-500 text-sm line-clamp-3 mb-4">
                  {resource.content.substring(0, 150)}...
                </p>
                <div className="flex flex-wrap gap-2">
                  {resource.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-4 border-t border-slate-100 flex justify-between bg-slate-50/50 rounded-b-xl">
                <button 
                  onClick={() => setSelectedResource(resource)}
                  className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 font-medium"
                >
                  <Eye size={16} /> Preview
                </button>
                <button 
                  onClick={() => onDelete(resource.id)}
                  className="flex items-center gap-2 text-sm text-red-400 hover:text-red-600 font-medium"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center">
            <div className="inline-block p-4 rounded-full bg-slate-100 mb-4">
              <Search className="text-slate-400" size={32} />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No resources found</h3>
            <p className="text-slate-500">Try adjusting your filters or create a new resource.</p>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {selectedResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10">
              <div className="flex items-center gap-4">
                 <div className="p-2 bg-slate-50 rounded-lg">
                    {getIcon(selectedResource.type)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{selectedResource.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono text-slate-400">
                        {new Date(selectedResource.createdAt).toLocaleDateString()}
                      </span>
                      {selectedResource.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
              </div>
              <button 
                onClick={() => setSelectedResource(null)} 
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 p-8 overflow-y-auto bg-slate-50/50">
               <div className="prose prose-slate max-w-none bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                  {renderContent(selectedResource.content)}
               </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-2">
              <button 
                onClick={() => { onDelete(selectedResource.id); setSelectedResource(null); }}
                className="px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg font-medium transition-colors"
              >
                Delete
              </button>
              <button 
                onClick={() => setSelectedResource(null)} 
                className="px-6 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Library;