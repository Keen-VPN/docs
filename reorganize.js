const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// Ensure targets exist
ensureDir('c4-documentation');
ensureDir('architecture');
ensureDir('clients');
ensureDir('backend');
ensureDir('features');
ensureDir('legacy-v1');

function safeMove(src, dest) {
    if (fs.existsSync(src)) {
        const destDir = path.dirname(dest);
        ensureDir(destDir);
        fs.cpSync(src, dest, { recursive: true }); // copy
        fs.rmSync(src, { recursive: true, force: true }); // then delete
        console.log(`Moved: ${src} -> ${dest}`);
    } else {
        console.warn(`Warning: Source not found: ${src}`);
    }
}

function toKebabCase(filename) {
    return filename.toLowerCase().replace(/_/g, '-');
}

// 1. Move current/ -> legacy-v1/
if (fs.existsSync('current')) {
    const v1Files = execSync('find current -type f').toString().trim().split('\n').filter(Boolean);
    v1Files.forEach(f => {
        const newPath = f.replace(/^current\//, 'legacy-v1/').split('/').map(p => toKebabCase(p)).join('/');
        safeMove(f, newPath);
    });
}

// 2. Specific targeted moves (using new/ instead of v2/ since that exists in tree)
safeMove('new/architecture/C4_B2C_PHOENIX.md', 'c4-documentation/c4-context-phoenix.md');
safeMove('new/architecture/C4_B2B_AEGIS.md', 'c4-documentation/c4-context-aegis.md');
safeMove('new/architecture/B2B_ARCHITECTURE_RFC.md', 'architecture/b2b-architecture-rfc.md');
safeMove('new/architecture/B2C_BACKEND_DESIGN.md', 'architecture/b2c-backend-design.md');
safeMove('new/architecture/BACKEND_SERVICE_CATALOG.md', 'architecture/backend-service-catalog.md');
safeMove('new/architecture/INFRASTRUCTURE_DESIGN.md', 'architecture/infrastructure-design.md');
safeMove('new/architecture/INFRASTRUCTURE_DETAILED_DESIGN.md', 'architecture/infrastructure-detailed-design.md');
safeMove('new/architecture/INFRASTRUCTURE_SCAFFOLDING.md', 'architecture/infrastructure-scaffolding.md');
safeMove('new/clients/ANDROID_ROADMAP.md', 'clients/android-roadmap.md');
safeMove('new/clients/CLIENT_ARCHITECTURE.md', 'clients/client-architecture.md');
safeMove('new/clients/CLIENT_DETAILED_DESIGN.md', 'clients/client-detailed-design.md');
safeMove('new/clients/CLIENT_SCAFFOLDING.md', 'clients/client-scaffolding.md');
safeMove('new/features/ADBLOCK_PRIVACY_SPEC.md', 'features/adblock-privacy-spec.md');
safeMove('new/security/THREAT-MODEL-001.md', 'architecture/threat-model-001.md');

// This might be capitalization since I checked it out from commit history
// skipped
else if (fs.existsSync('PRODUCT_OVERVIEW.md')) safeMove('PRODUCT_OVERVIEW.md', 'product-overview.md');

// 3. Move other C4 files
if (fs.existsSync('C4-Documentation')) {
    const c4files = execSync('find C4-Documentation -type f').toString().trim().split('\n').filter(Boolean);
    c4files.forEach(f => {
        const newPath = f.replace('C4-Documentation/', 'c4-documentation/').split('/').map(p => toKebabCase(p)).join('/');
        safeMove(f, newPath);
    });
}

// 4. Move backend-modules files
if (fs.existsSync('backend-modules')) {
    const backendFiles = execSync('find backend-modules -type f').toString().trim().split('\n').filter(Boolean);
    backendFiles.forEach(f => {
        const newPath = f.replace('backend-modules/', 'backend/').split('/').map(p => toKebabCase(p)).join('/');
        safeMove(f, newPath);
    });
}

// 5. Cleanup empty directories
try { execSync('rm -rf current new C4-Documentation backend-modules'); } catch (e) { }

console.log("Restructuring complete!");
