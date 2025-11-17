"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "/ month",
    description: "Get started and see how it works.",
    features: [
      "1 Public Sheet",
      "Community Support",
      "Basic Customization"
    ],
    cta: "Get Started",
    variant: "secondary"
  },
  {
    name: "Pro",
    price: "$10",
    period: "/ month",
    description: "For professionals who need more power.",
    features: [
      "10 Public Sheets",
      "Email Support",
      "Advanced Customization",
      "Remove Branding"
    ],
    cta: "Upgrade to Pro",
    variant: "default"
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large teams and organizations.",
    features: [
      "Unlimited Sheets",
      "Dedicated Support",
      "Custom Domain",
      "Team Collaboration"
    ],
    cta: "Contact Sales",
    variant: "outline"
  }
];

export default function PricingPage() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center mb-12">
          <h1 className="text-3xl font-headline font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Find the perfect plan
          </h1>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-lg">
            Start for free, then upgrade as you grow.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier) => (
            <Card key={tier.name} className="flex flex-col">
              <CardHeader>
                <CardTitle className="font-headline">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
                <div className="flex items-baseline">
                    <span className="text-4xl font-bold tracking-tighter">{tier.price}</span>
                    {tier.period && <span className="text-sm font-medium text-muted-foreground">{tier.period}</span>}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-4">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant={tier.variant as any}>
                  {tier.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
