
'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from './ui/skeleton';
import { type processGalleryLinks } from '@/lib/sheets';

// Dynamically import ProjectDetails only on the client side
const ProjectDetails = dynamic(() => import('./ProjectDetails').then(mod => mod.ProjectDetails), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-background p-8"><Skeleton className="w-full h-full" /></div>
});

type ProcessedItem = ReturnType<typeof processGalleryLinks>;

interface ProjectExplorerProps {
  projects: ProcessedItem[];
  initialProject: ProcessedItem;
}

export function ProjectExplorer({ projects, initialProject }: ProjectExplorerProps) {
  const [activeTab, setActiveTab] = useState(initialProject.title);

  // Find the project object that corresponds to the active tab
  const activeProject = projects.find(p => p.title === activeTab);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
      <TabsList className="m-2">
        {projects.map(project => (
          <TabsTrigger key={project.title} value={project.title}>
            {project.title}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value={activeTab} className="flex-1 overflow-hidden mt-0">
        {activeProject && <ProjectDetails project={activeProject} />}
      </TabsContent>
    </Tabs>
  );
}
