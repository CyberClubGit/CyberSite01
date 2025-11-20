
'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from './ui/skeleton';
import { type processGalleryLinks } from '@/lib/sheets';
import { cn } from '@/lib/utils';

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
      <TabsList className="bg-transparent p-0 m-0 border-b border-border justify-start rounded-none">
        {projects.map(project => (
          <TabsTrigger 
            key={project.title} 
            value={project.title}
            className={cn(
              "relative -mb-px rounded-t-lg border-x border-t p-2 mx-1 transition-colors duration-200",
              "data-[state=inactive]:border-border/50 data-[state=inactive]:bg-muted/30 data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/60",
              "data-[state=active]:border-border data-[state=active]:border-b-transparent data-[state=active]:bg-background/80 data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            )}
          >
            {project.title}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value={activeTab} className="flex-1 overflow-auto mt-0 bg-background/80 backdrop-blur-sm border-t border-border">
        {activeProject && <ProjectDetails project={activeProject} />}
      </TabsContent>
    </Tabs>
  );
}
