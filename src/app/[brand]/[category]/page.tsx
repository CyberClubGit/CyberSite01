
type PageProps = {
  params: { brand: string; category: string };
};

export default function BrandCategoryPage({ params }: PageProps) {
  const { brand, category } = params;

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-headline font-black tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none capitalize">
              {category.replace('-', ' ')}
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              Contenu à venir pour {category.replace('-', ' ')} sous la marque {brand}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
