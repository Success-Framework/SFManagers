#!/bin/bash

# Build the frontend
echo "Building frontend..."
npm run build

# Create deployment directory
echo "Creating deployment package..."
mkdir -p deploy
cp -r dist deploy/
cp -r src deploy/
cp package.json deploy/
cp package-lock.json deploy/
cp tsconfig.json deploy/
cp .env deploy/

# Create start script
echo "Creating start script..."
cat > deploy/start.sh << 'EOF'
#!/bin/bash
npm install
npm run build
NODE_ENV=production node dist/server.js
EOF

chmod +x deploy/start.sh

echo "Deployment package created in 'deploy' directory"
echo "To deploy:"
echo "1. Upload the contents of the 'deploy' directory to your server"
echo "2. Set up your environment variables in .env"
echo "3. Run ./start.sh to start the application" 