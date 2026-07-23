20:09:01.685 Running build in Washington, D.C., USA (East) – iad1
20:09:01.685 Build machine configuration: 2 cores, 8 GB
20:09:01.820 Cloning github.com/admincecdf-debug/cec-painel (Branch: main, Commit: 77875b7)
20:09:03.382 Cloning completed: 1.562s
20:09:04.035 Restored build cache from previous deployment (8MFEgpRWVWBiRje9MDtegf7s6NYH)
20:09:04.261 Running "vercel build"
20:09:04.279 Vercel CLI 56.5.0
20:09:04.508 Installing dependencies...
20:09:05.586 
20:09:05.586 up to date in 943ms
20:09:05.587 
20:09:05.587 160 packages are looking for funding
20:09:05.587   run `npm fund` for details
20:09:05.615 Detected Next.js version: 14.2.5
20:09:05.620 Running "npm run build"
20:09:05.723 
20:09:05.723 > cec-family@1.0.0 build
20:09:05.723 > next build
20:09:05.724 
20:09:06.434   ▲ Next.js 14.2.5
20:09:06.435 
20:09:06.458    Creating an optimized production build ...
20:09:21.337  ✓ Compiled successfully
20:09:21.339    Linting and checking validity of types ...
20:09:43.304 Failed to compile.
20:09:43.309 
20:09:43.309 ./src/app/dizimo/page.tsx:22:29
20:09:43.310 Type error: Property 'pix_key' does not exist on type 'Church'.
20:09:43.310 
20:09:43.310   20 |   const { data: community } = useActiveCommunity();
20:09:43.310   21 |   const [copied, setCopied] = useState(false);
20:09:43.311 > 22 |   const pixKey = community?.pix_key || DEFAULT_PIX_KEY;
20:09:43.311      |                             ^
20:09:43.312   23 |   const pixTypeLabel = community?.pix_key ? PIX_TYPE_LABELS[community.pix_key_type ?? ""] ?? "Chave" : DEFAULT_PIX_TYPE;
20:09:43.312   24 |
20:09:43.312   25 |   function copyPix() {
20:09:43.426 Error: Command "npm run build" exited with 1
