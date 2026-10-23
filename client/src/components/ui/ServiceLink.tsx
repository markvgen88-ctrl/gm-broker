import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Service } from "@/data/services";

interface ServiceLinkProps {
  service: Service;
  className?: string;
  children: ReactNode;
}

/** Ссылка на страницу услуги /services/:slug. */
export function ServiceLink({ service, className, children }: ServiceLinkProps) {
  return (
    <Link to={`/services/${service.slug}`} className={className}>
      {children}
    </Link>
  );
}
