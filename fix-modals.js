const fs = require('fs');
const path = require('path');

const files = [
    'src/app/clients/page.tsx',
    'src/app/inventory/page.tsx',
    'src/app/knowledge/page.tsx',
    'src/app/staff/page.tsx',
    'src/app/users/page.tsx',
    'src/app/management/page.tsx',
    'src/app/calendar/page.tsx',
    'src/app/reports/page.tsx',
    'src/app/service-reports/page.tsx'
];

for (const filePath of files) {
    if (!fs.existsSync(filePath)) continue;
    let code = fs.readFileSync(filePath, 'utf8');

    // Fix the overlay so it centers properly but allows scrolling if modal is tall
    // .modal-overlay { ... align-items: center; ... } -> { ... align-items: flex-start; padding-top: 5vh; overflow-y: auto; ... }
    code = code.replace(/align-items:\s*center;\s*justify-content:\s*center;/g, 'align-items: flex-start; justify-content: center; padding-top: 5vh; padding-bottom: 5vh; overflow-y: auto;');

    // Fix modal-content to be responsive and not bleed outside
    // .modal-content { ... }
    if (!code.includes('max-height: 90vh')) {
        code = code.replace(/\.modal-content\s*\{[^}]+box-shadow:[^;]+;/g, '$& max-height: 90vh; overflow-y: auto;');
    }

    fs.writeFileSync(filePath, code);
}

console.log('Fixed modals in all files.');
