# MBM Orbital

MBM Orbital is an interactive hand-tracking web experience that allows users to draw a circle in the air using hand gestures.

The app tracks the user's hand through the camera, draws the fingertip path in real time, and analyzes the result using multiple accuracy metrics.

## Live Demo

https://mustafa-maqadmeh.github.io/mbm-orbital/

## Features

- Real-time hand tracking using MediaPipe
- Draw using only the index finger
- Finish the drawing using two fingers
- Clear the drawing using a fist gesture
- Neon fingertip tracking
- Real-time canvas drawing
- Circle Circularity analysis
- Smoothness analysis
- Closure analysis
- Final score out of 100
- Animated score reveal
- Best score saved using Local Storage
- Responsive futuristic UI
- MBM branding

## Hand Controls

- ☝️ Index finger — Draw
- ✌️ Index + middle finger — Finish and analyze
- ✊ Fist — Clear the drawing

## Circle Scoring

The final score is calculated using:

- Circularity — 50%
- Smoothness — 30%
- Closure — 20%

## Technologies

- React
- JavaScript
- Vite
- MediaPipe Tasks Vision
- HTML5 Canvas
- CSS
- Local Storage

## Installation

Clone the repository:

```bash
git clone https://github.com/Mustafa-Maqadmeh/mbm-orbital.git