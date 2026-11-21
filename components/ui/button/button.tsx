import Link from "next/link";

interface ButtonLinkProps {
  href: string;
  children: React.ReactNode;
}

export function ButtonLink({ href, children }: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className="inline-block rounded-full bg-white px-6 py-2.5 text-sm font-medium text-black transition duration-200 hover:scale-105 hover:bg-neutral-200"
    >
      {children}
    </Link>
  );
}