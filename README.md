# server-photos

I had a folder of photos sitting on my home server with no good way to browse them. I didn't want just a file server — I wanted something that actually felt like Apple Photos: a timeline, a map, albums. So I built it.

Upload photos from a browser and browse them in a timeline, map, and albums UI, all running on your own hardware.

## Features

- **Timeline** — photos grouped by year and month
- **Map** — GPS-tagged photos plotted on an interactive map
- **Albums** — create and organize albums
- **Lightbox** — full-screen viewer with keyboard and swipe navigation
- **Auto-geocoding** — coordinates reverse-geocoded to place names
- **Thumbnails** — WebP thumbnails generated automatically on upload

## Stack

Node.js + Fastify backend, SQLite database, React 18 + Vite frontend, react-leaflet for the map. Photos stored on the local filesystem; EXIF/GPS extracted on upload.

Designed for LAN or Tailscale use — no auth, no cloud.
