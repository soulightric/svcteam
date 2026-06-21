"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, CSSProperties, ReactNode } from "react";

type NavLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  /** Class(es) ditambahkan ketika rute sedang aktif */
  activeClassName?: string;
  style?: CSSProperties;
  /** Style di-merge ketika rute sedang aktif */
  activeStyle?: CSSProperties;
  /** true = aktif hanya jika path persis sama; false = juga aktif untuk sub-rute */
  exact?: boolean;
} & Omit<ComponentProps<typeof Link>, "href" | "className" | "style">;

/**
 * NavLink — Link dari next/link yang sadar rute aktif.
 * Navigasi client-side (tanpa reload) + penanda halaman aktif.
 */
export default function NavLink({
  href,
  children,
  className = "",
  activeClassName = "",
  style,
  activeStyle,
  exact = false,
  ...rest
}: NavLinkProps) {
  const pathname = usePathname();
  const isActive = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href.endsWith("/") ? href : href + "/");

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`${className} ${isActive ? activeClassName : ""}`.trim()}
      style={{ ...style, ...(isActive ? activeStyle : {}) }}
      {...rest}
    >
      {children}
    </Link>
  );
}
