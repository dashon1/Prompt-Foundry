import { Link } from "wouter";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "Product",
      links: [
        { label: "Generators", href: "/generators" },
        { label: "Playground", href: "/playground" },
        { label: "API", href: "/api" }
      ]
    },
    {
      title: "Resources",
      links: [
        { label: "Documentation", href: "/api" },
        { label: "API Reference", href: "/api" },
        { label: "Examples", href: "/generators" }
      ]
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "/" },
        { label: "Privacy", href: "/" },
        { label: "Terms", href: "/" }
      ]
    }
  ];

  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">Prompt Foundry</h3>
            <p className="text-sm text-muted-foreground">
              Build world-class prompts & agents for every use case.
            </p>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 text-foreground">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href}>
                      <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer" data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, '-')}`}>
                        {link.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground text-center" data-testid="text-copyright">
            © {currentYear} Prompt Foundry. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
