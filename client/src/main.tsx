import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { BookIcon } from "lucide-react";

// Set document title and favicon
document.title = "BookNest - Your Digital Reading Companion";

// Creating a favicon programmatically
const favicon = document.createElement("link");
favicon.rel = "icon";
favicon.href = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1a5653" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
  </svg>
`);
document.head.appendChild(favicon);

// Add proper meta tags
const meta = document.createElement("meta");
meta.name = "description";
meta.content = "BookNest - A digital platform for book lovers to discover, review and share their reading experiences";
document.head.appendChild(meta);

// Font preconnect
const fontPreconnect = document.createElement("link");
fontPreconnect.rel = "preconnect";
fontPreconnect.href = "https://fonts.googleapis.com";
document.head.appendChild(fontPreconnect);

const fontPreconnect2 = document.createElement("link");
fontPreconnect2.rel = "preconnect";
fontPreconnect2.href = "https://fonts.gstatic.com";
fontPreconnect2.crossOrigin = "";
document.head.appendChild(fontPreconnect2);

// Import fonts
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Merriweather:wght@400;700&family=Playfair+Display:wght@500;600;700&display=swap";
document.head.appendChild(fontLink);

createRoot(document.getElementById("root")!).render(<App />);
