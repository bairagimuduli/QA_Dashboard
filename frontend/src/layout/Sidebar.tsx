import type { ComponentType } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTheme } from "../theme/ThemeProvider";

function IconHome() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z" />
    </svg>
  );
}
function IconBolt() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="2" strokeLinecap="round" d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
    </svg>
  );
}
function IconGrid() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
      <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="2" strokeLinecap="round" d="M12 8v4l2 2m6-2a8 8 0 11-16 0 8 8 0 0116 0z" />
    </svg>
  );
}

function IconTestMgmt() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function IconSun() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeWidth="2"
        strokeLinecap="round"
        d="M12 3v2m0 14v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M3 12h2m14 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 8a4 4 0 100 8 4 4 0 000-8z"
      />
    </svg>
  );
}

function IconMoon() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="2" strokeLinecap="round" d="M21 14.5A8.5 8.5 0 0110.5 4 6.5 6.5 0 0021 14.5z" />
    </svg>
  );
}

function IconKnight() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

function IconReport() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 17v-6a2 2 0 012-2h8m0 0v10a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h5m4-2v4m0 0l2-2m-2 2l-2-2"
      />
    </svg>
  );
}

function IconQaDashboard() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
      />
    </svg>
  );
}

function IconWizard() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </svg>
  );
}

function IconMobile() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 3h8a2 2 0 012 2v14a2 2 0 01-2 2H8a2 2 0 01-2-2V5a2 2 0 012-2zm4 16.5a1 1 0 100-2 1 1 0 000 2z"
      />
    </svg>
  );
}

/** All primary app areas live under the QA Dashboard group in the sidebar. */
const qaDashboardNavItems: { to: string; end?: boolean; label: string; Icon: ComponentType }[] = [
  { to: "/qa-dashboard", end: true, label: "Home Page", Icon: IconHome },
  { to: "/", end: true, label: "Dashboard", Icon: IconQaDashboard },
  { to: "/heatmap", label: "Live View", Icon: IconGrid },
  { to: "/qa", end: true, label: "QA Ops", Icon: IconBolt },
  { to: "/history", label: "History", Icon: IconClock },
  { to: "/dark-knight", end: true, label: "Performance testing", Icon: IconKnight },
  { to: "/qa-dashboard/mobile-ui", end: true, label: "Mobile UI automation", Icon: IconMobile },
  { to: "/qa-dashboard/features", label: "Test case management", Icon: IconTestMgmt },
  { to: "/reports", label: "Reports", Icon: IconReport },
  { to: "/wizard", end: true, label: "Trigger wizard", Icon: IconWizard },
];

export function isUnderQaDashboardNav(pathname: string): boolean {
  if (pathname === "/" || pathname === "/qa-dashboard") return true;
  if (pathname.startsWith("/qa-dashboard/")) return true;
  if (pathname === "/qa") return true;
  if (pathname.startsWith("/heatmap")) return true;
  if (pathname.startsWith("/history")) return true;
  if (pathname.startsWith("/dark-knight")) return true;
  if (pathname.startsWith("/reports")) return true;
  if (pathname.startsWith("/wizard")) return true;
  return false;
}

const linkBase =
  "flex h-11 min-w-0 shrink-0 items-center gap-3 rounded-xl pl-3 pr-3 text-slate-400 transition hover:bg-white/10 hover:text-white aria-[current=page]:bg-rose-500/90 aria-[current=page]:text-white";

const subLinkBase =
  "flex min-h-9 min-w-0 items-center gap-2 rounded-lg py-1.5 pl-2 pr-2 text-[13px] text-slate-400 transition hover:bg-white/10 hover:text-white aria-[current=page]:bg-rose-500/90 aria-[current=page]:text-white";

const labelSpan =
  "max-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-left text-sm font-medium opacity-0 transition-[max-width,opacity] duration-200 group-hover/sidebar:max-w-[220px] group-hover/sidebar:opacity-100";

const subLabelSpan =
  "max-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-left opacity-0 transition-[max-width,opacity] duration-200 group-hover/sidebar:max-w-[200px] group-hover/sidebar:opacity-100";

export function Sidebar() {
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();
  const sectionActive = isUnderQaDashboardNav(pathname);

  return (
    <aside className="group/sidebar relative z-20 flex h-screen max-h-[100dvh] w-[72px] shrink-0 flex-col gap-1 overflow-hidden border-r border-indigo-950/50 bg-gradient-to-b from-[#1e1b4b] to-[#0f172a] py-5 transition-[width] duration-200 ease-out hover:w-60">
      <div className="relative mb-3 h-12 shrink-0 px-3">
        <img
          src="/mpokket-mark.png"
          alt=""
          className="absolute left-3 top-1/2 h-10 w-10 -translate-y-1/2 object-contain opacity-100 transition-opacity duration-200 group-hover/sidebar:opacity-0"
          aria-hidden
        />
        <img
          src="/mpokket-logo.png"
          alt="mPokket"
          className="absolute left-3 top-1/2 h-10 w-auto max-w-[200px] -translate-y-1/2 object-contain object-left opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100"
        />
      </div>
      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2">
        <div
          className={`rounded-xl pb-1 pt-1 ${sectionActive ? "bg-white/5 ring-1 ring-white/10" : ""}`}
        >
          <div className="px-1">
            {qaDashboardNavItems.map(({ to, end, label, Icon }) => (
              <NavLink key={to + label} to={to} end={end} className={subLinkBase} title={label}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center [&>svg]:h-4 [&>svg]:w-4">
                  <Icon />
                </span>
                <span className={subLabelSpan}>{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
      <div className="mt-auto shrink-0 border-t border-white/10 px-2 pb-1 pt-3">
        <button
          type="button"
          onClick={toggle}
          className={linkBase + " w-full text-left"}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center">
            {theme === "dark" ? <IconSun /> : <IconMoon />}
          </span>
          <span className={labelSpan}>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
        </button>
      </div>
    </aside>
  );
}
