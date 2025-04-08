#!/bin/bash
npm install
npm run build
NODE_ENV=production node dist/server.js
