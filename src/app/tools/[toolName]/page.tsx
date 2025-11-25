import { getCategoryData } from '@/lib/sheets';
import { notFound } from 'next/navigation';

// Function to create a URL-friendly slug from a title
const slugify = (text: string) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-');        // Replace multiple - with single -
};

// Generate static paths for each tool
export async function generateStaticParams() {
  const toolsData = await getCategoryData('tools');
  
  return toolsData.map(tool => ({
    toolName: slugify(tool.Title || tool.Name || tool.Item || ''),
  }));
}

export default async function ToolPage({ params }: { params: { toolName: string } }) {
  const { toolName } = params;
  if (!toolName) {
    notFound();
  }

  const toolsData = await getCategoryData('tools');
  
  // Find the tool that matches the slug
  const tool = toolsData.find(item => {
    const title = item.Title || item.Name || item.Item;
    return title && slugify(title) === toolName;
  });

  if (!tool) {
    notFound();
  }

  // Get the app URL, checking for different possible column names
  const appUrl = tool['App URL'] || tool['App Url'] || tool['app_url'];

  if (!appUrl) {
    return (
        <div className="flex items-center justify-center h-screen bg-background text-foreground">
            <div className="text-center">
                <h1 className="text-2xl font-headline mb-4">Lien non disponible</h1>
                <p className="text-muted-foreground">L'application pour "{tool.Title || tool.Name}" n'a pas pu être chargée.</p>
            </div>
        </div>
    );
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 1000,
      overflow: 'hidden'
    }}>
      <iframe
        src={appUrl}
        className="w-full h-full border-0"
        title={tool.Title || tool.Name || 'Tool Application'}
        allow="camera; microphone; geolocation; vr"
      />
    </div>
  );
}
