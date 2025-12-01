#!/bin/bash
#
# Build script to create a VSIX package for the ItDependsOn VS Code extension.
#
# Usage:
#   ./scripts/build-vsix.sh [options]
#
# Options:
#   --clean         Clean build directories before building
#   --skip-install  Skip npm install step (useful when dependencies are cached)
#
# Examples:
#   ./scripts/build-vsix.sh
#   ./scripts/build-vsix.sh --clean
#   ./scripts/build-vsix.sh --skip-install

set -e

# Parse arguments
CLEAN=false
SKIP_INSTALL=false

for arg in "$@"; do
    case $arg in
        --clean)
            CLEAN=true
            shift
            ;;
        --skip-install)
            SKIP_INSTALL=true
            shift
            ;;
        *)
            echo "Unknown option: $arg"
            exit 1
            ;;
    esac
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Get script directory and navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo -e "${CYAN}======================================${NC}"
echo -e "${CYAN}  ItDependsOn VSIX Build Script${NC}"
echo -e "${CYAN}======================================${NC}"
echo ""

# Clean if requested
if [ "$CLEAN" = true ]; then
    echo -e "${YELLOW}[1/6] Cleaning build directories...${NC}"
    rm -rf dist out webview/dist *.vsix
    echo -e "${GREEN}  Clean completed.${NC}"
else
    echo -e "[1/6] Skipping clean (use --clean flag to enable)"
fi

# Install dependencies
if [ "$SKIP_INSTALL" = false ]; then
    echo ""
    echo -e "${YELLOW}[2/6] Installing main extension dependencies...${NC}"
    npm install
    echo -e "${GREEN}  Main dependencies installed.${NC}"

    echo ""
    echo -e "${YELLOW}[3/6] Installing webview dependencies...${NC}"
    cd webview
    npm install
    cd "$PROJECT_ROOT"
    echo -e "${GREEN}  Webview dependencies installed.${NC}"
else
    echo "[2/6] Skipping main dependency install (--skip-install)"
    echo "[3/6] Skipping webview dependency install (--skip-install)"
fi

# Compile extension TypeScript
echo ""
echo -e "${YELLOW}[4/6] Compiling extension TypeScript...${NC}"
npm run compile:extension
echo -e "${GREEN}  Extension compiled successfully.${NC}"

# Build webview
echo ""
echo -e "${YELLOW}[5/6] Building webview React application...${NC}"
npm run compile:webview
echo -e "${GREEN}  Webview built successfully.${NC}"

# Package VSIX
echo ""
echo -e "${YELLOW}[6/6] Packaging VSIX...${NC}"
npx vsce package
echo -e "${GREEN}  VSIX package created successfully.${NC}"

# Find and display the created VSIX file
VSIX_FILE=$(ls -t *.vsix 2>/dev/null | head -n 1)
if [ -n "$VSIX_FILE" ]; then
    VSIX_SIZE=$(du -h "$VSIX_FILE" | cut -f1)
    echo ""
    echo -e "${CYAN}======================================${NC}"
    echo -e "${GREEN}  Build Complete!${NC}"
    echo -e "${CYAN}======================================${NC}"
    echo ""
    echo -e "${WHITE}  VSIX file: $VSIX_FILE${NC}"
    echo -e "${WHITE}  Size: $VSIX_SIZE${NC}"
    echo -e "${WHITE}  Path: $PROJECT_ROOT/$VSIX_FILE${NC}"
    echo ""
    echo -e "${YELLOW}  To install:${NC}"
    echo -e "${WHITE}    code --install-extension $VSIX_FILE${NC}"
    echo ""
fi