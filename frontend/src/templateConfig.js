// frontend/src/templateConfig.js

// The base layout strictly enforces the physical 210mm x 297mm A4 size on screen, 
// while stripping it down for the native print engine.
export const baseLayout = "w-[210mm] min-h-[297mm] shrink-0 mx-auto bg-white p-[15mm] box-border shadow-2xl relative prose max-w-none transition-all duration-300 print:w-full print:min-h-0 print:p-0 print:m-0 print:shadow-none";

export const templateStyles = {
  Modern: {
    typography: "font-sans",
    textSize: "prose-sm sm:prose-base print:prose-sm",
    heading: "prose-headings:text-blue-700 prose-h2:border-b-2 prose-h2:border-blue-200 prose-h2:pb-2",
    subheading: "prose-h3:text-slate-800 prose-h3:font-bold",
    text: "prose-p:text-slate-600 prose-li:text-slate-600 prose-a:text-blue-600"
  },
  Classic: {
    typography: "font-serif",
    textSize: "prose-sm sm:prose-base print:prose-sm",
    heading: "prose-headings:font-serif prose-headings:text-black prose-h2:border-b-[1.5px] prose-h2:border-black prose-h2:pb-1",
    subheading: "prose-h3:text-gray-900 prose-h3:font-bold",
    text: "prose-p:text-black prose-li:text-black prose-a:text-black"
  },
  Minimalist: {
    typography: "font-sans font-light",
    textSize: "prose-sm sm:prose-base print:prose-xs",
    heading: "prose-headings:font-normal prose-headings:text-black prose-h2:uppercase prose-h2:tracking-[0.2em] prose-h2:text-gray-500 prose-h2:text-sm prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-2",
    subheading: "prose-h3:text-gray-800 prose-h3:font-medium",
    text: "prose-p:text-gray-500 prose-li:text-gray-500 prose-a:text-gray-700"
  }
};
