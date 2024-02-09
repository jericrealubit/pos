"use client";
import Image from "next/image";
import { ModeToggle } from "./ui/toggle-mode";
import { Button } from "./ui/button";
import Link from "next/link";

const routes = [
  {
    href: "/",
    label: "Products",
  },
  {
    href: "/",
    label: "Stocks",
  },
  {
    href: "/",
    label: "Reports",
  },
];

const Nav = () => {
  return (
    <header>
      <nav>
        <ul className="flex items-center justify-between">
          <li>
            <a
              className="pointer-events-none flex place-items-center gap-2 p-8 lg:pointer-events-auto lg:p-0"
              href="https://vercel.com?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src="/vercel.svg"
                alt="Vercel Logo"
                className="dark:invert"
                width={100}
                height={24}
                priority
              />
            </a>
          </li>
          {routes.map((route, i) => (
            <Button asChild variant="ghost" key={i}>
              <Link href={route.href} className="block px-2 py-1 text-lg">
                {route.label}
              </Link>
            </Button>
          ))}
          <li>
            <ModeToggle />
          </li>
        </ul>
      </nav>
    </header>
  );
};
export default Nav;
