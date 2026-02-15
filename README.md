# BG Remover — AI Background Removal Tool

A stunning, client-side background removal tool built with Next.js and WebAssembly.

## Features

- **100% Client-Side**: Runs entirely in your browser using `@imgly/background-removal`. No images are uploaded to any server.
- **Privacy Focused**: Your photos stay on your device.
- **Modern UI**: Dark mode, glassmorphism design, and smooth animations.
- **Interactive Comparison**: Slide to compare original vs. processed image.
- **Fast & Free**: No API keys or credits required.

## Getting Started

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Prepare Assets**:
    The AI models and WebAssembly files need to be in the `public/imgly` directory. If they are missing, copy them:
    ```bash
    # Windows (PowerShell)
    New-Item -ItemType Directory -Force -Path public\imgly
    Copy-Item -Path "node_modules\@imgly\background-removal\dist\*" -Destination "public\imgly" -Recurse
    ```

3.  **Run the development server**:
    ```bash
    npm run dev
    ```

4.  **Open the app**:
    Visit [http://localhost:3000](http://localhost:3000) (or the port shown in your terminal).

## Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Styling**: Tailwind CSS v4
- **AI/ML**: @imgly/background-removal (WASM/ONNX)
- **Language**: TypeScript

## Configuration

The app is configured to serve ML assets from the `/imgly/` public path to ensure compatibility with Next.js bundlers (Webpack/Turbopack).
