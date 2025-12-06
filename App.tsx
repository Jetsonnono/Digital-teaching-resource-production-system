import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import CreateResource from './pages/CreateResource';
import Library from './pages/Library';
import { Resource, ResourceType } from './types';

// Mock Initial Data
const INITIAL_RESOURCES: Resource[] = [
  {
    id: '1',
    title: 'Introduction to Photosynthesis',
    type: ResourceType.LESSON_PLAN,
    content: '# Lesson Plan: Photosynthesis\n\n## Objectives\n- Understand the process...\n\n## Materials\n- Plant samples...',
    createdAt: new Date().toISOString(),
    tags: ['Biology', 'Grade 8'],
  },
  {
    id: '2',
    title: 'World War II Timeline Quiz',
    type: ResourceType.QUIZ,
    content: '1. What year did WWII start?\n   a) 1935\n   b) 1939...',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    tags: ['History', 'Grade 10'],
  }
];

const App: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>(INITIAL_RESOURCES);

  const addResource = (resource: Resource) => {
    setResources([resource, ...resources]);
  };

  const deleteResource = (id: string) => {
    setResources(resources.filter(r => r.id !== id));
  };

  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="ml-64 flex-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create" element={<CreateResource onSave={addResource} />} />
            <Route path="/library" element={<Library resources={resources} onDelete={deleteResource} />} />
            {/* Fallback routes could go here */}
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
