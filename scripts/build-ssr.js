import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prettier from 'prettier';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read the template HTML
const templatePath = path.resolve(__dirname, '../dist/index.html');
if (!fs.existsSync(templatePath)) {
  console.error('Error: dist/index.html not found. Please run "npm run build:client" first.');
  process.exit(1);
}

const template = fs.readFileSync(templatePath, 'utf-8');

// Find the server entry point in dist-ssr
const ssrDir = path.resolve(__dirname, '../dist-ssr');
if (!fs.existsSync(ssrDir)) {
  console.error('Error: dist-ssr directory not found. Please run "npm run build:server" first.');
  process.exit(1);
}

const serverEntryFiles = fs.readdirSync(ssrDir).filter(file => file.startsWith('entry-server'));
if (serverEntryFiles.length === 0) {
  console.error('Error: No server entry point found in dist-ssr. Please run "npm run build:server" first.');
  process.exit(1);
}

// Import the server entry point
let render;
try {
  const serverEntryPath = path.resolve(ssrDir, serverEntryFiles[0]);
  const serverModule = await import(serverEntryPath);
  render = serverModule.render || serverModule.default;
  if (typeof render !== 'function') {
    throw new Error('No render function exported from SSR bundle.');
  }
} catch (error) {
  console.error('Error importing server entry point:', error);
  process.exit(1);
}

// Find the client entry point with hashed name
const assetsDir = path.resolve(__dirname, '../dist/assets');
if (!fs.existsSync(assetsDir)) {
  console.error('Error: dist/assets directory not found. Please run "npm run build:client" first.');
  process.exit(1);
}

// Look for the main client entry file (main-[hash].js)
const clientEntryFiles = fs.readdirSync(assetsDir).filter(file => file.startsWith('main-') && file.endsWith('.js'));
if (clientEntryFiles.length === 0) {
  console.error('Error: No client entry point found. Please run "npm run build:client" first.');
  process.exit(1);
}

// Define the routes to pre-render
const routes = [
  { path: '/', output: 'index.html' },
];

// Function to render each route
async function renderRoute(route) {
  try {
    const appHtml = render(route.path);
    
    // Replace the root div with the rendered HTML
    let html = template.replace(`<div id="root"></div>`, `<div id="root">${appHtml}</div>`);
    
    // Replace the script tag to use the correct hashed JS file
    const scriptTag = `<script type="module" crossorigin src="/assets/${clientEntryFiles[0]}"></script>`;
    html = html.replace(/<script type="module" src="\/src\/main\.tsx"><\/script>/, scriptTag);
    
    // Add basic CSS for SSR (this will be overridden by the client-side CSS when hydrated)
    const basicCSS = `
      <style>
        html, body {
          margin: 0;
          padding: 0;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #111827; /* Tailwind gray-900 */
          background-color: #ffffff; /* Tailwind white */
        }
        * {
          box-sizing: border-box;
        }
        h1, h2, h3, h4, h5, h6 {
          font-weight: 600;
        }
        a {
          color: #2563eb; /* Tailwind blue-600 */
          text-decoration: none;
        }
        .text-center {
          text-align: center;
        }
        .font-bold {
          font-weight: 700;
        }
        .bg-gray-100 {
          background-color: #f3f4f6;
        }
        .text-gray-500 {
          color: #6b7280;
        }
        .text-blue-500 {
          color: #3b82f6;
        } 
      </style>
    `;
    
    // Inject CSS into the head
    html = html.replace('</head>', `  ${basicCSS}\n</head>`);
    
    // Prettify the HTML using Prettier
    try {
      html = await prettier.format(html, {
        parser: 'html',
        printWidth: 120,
        tabWidth: 2,
        useTabs: false,
        semi: true,
        singleQuote: false,
        trailingComma: 'none',
        bracketSpacing: true,
        htmlWhitespaceSensitivity: 'css',
        endOfLine: 'lf'
      });
    } catch (prettierError) {
      console.warn(`Warning: Could not prettify ${route.output}:`, prettierError.message);
      // Continue without prettification if it fails
    }
    
    const outputPath = path.resolve(__dirname, '../dist', route.output);
    fs.writeFileSync(outputPath, html);
    console.log(`✓ Generated: ${route.output} (prettified)`);
  } catch (error) {
    console.error(`✗ Error generating ${route.output}:`, error);
  }
}

// Build all routes
console.log('🚀 Building static HTML files...');
await Promise.all(routes.map(renderRoute));
console.log('✅ SSR build complete!'); 