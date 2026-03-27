const fs = require('fs');

let code = fs.readFileSync('src/lib/services.ts', 'utf8');

const sanitizeStr = `
const sanitize = (obj: any) => {
    if (!obj || typeof obj !== 'object') return obj;
    const clean = { ...obj };
    Object.keys(clean).forEach(k => {
        if (clean[k] === '') clean[k] = null;
    });
    return clean;
};
`;

if (!code.includes('const sanitize =')) {
    code = code.replace("export const TicketService", sanitizeStr + "\nexport const TicketService");

    code = code.replace(/\.insert\(\[ticket\]\)/g, '.insert([sanitize(ticket)])');
    code = code.replace(/\.insert\(\[company\]\)/g, '.insert([sanitize(company)])');
    code = code.replace(/\.insert\(\[employee\]\)/g, '.insert([sanitize(employee)])');
    code = code.replace(/\.insert\(\[sede\]\)/g, '.insert([sanitize(sede)])');
    code = code.replace(/\.insert\(\[asset\]\)/g, '.insert([sanitize(asset)])');
    code = code.replace(/\.insert\(\[staff\]\)/g, '.insert([sanitize(staff)])');
    code = code.replace(/\.insert\(\[article\]\)/g, '.insert([sanitize(article)])');
    code = code.replace(/\.insert\(\[report\]\)/g, '.insert([sanitize(report)])');
    code = code.replace(/\.insert\(\[user\]\)/g, '.insert([sanitize(user)])');
    code = code.replace(/\.insert\(\[\{ username \}\]\)/g, ".insert([sanitize({ username })])");
    code = code.replace(/\.insert\(\[visit\]\)/g, '.insert([sanitize(visit)])');

    code = code.replace(/\.update\(updates\)/g, '.update(sanitize(updates))');

    fs.writeFileSync('src/lib/services.ts', code);
    console.log('Sanitization applied to services.ts');
} else {
    console.log('Sanitization already exists.');
}
