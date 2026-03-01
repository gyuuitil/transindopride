const bcrypt = require('bcryptjs');

async function hashPassword() {
    const plainPassword = process.argv[2] || 'admin123';
    const hashed = await bcrypt.hash(plainPassword, 10);
    console.log('\n' + '='.repeat(60));
    console.log('🔐 PASSWORD HASHER - Trans Indopride');
    console.log('='.repeat(60));
    console.log('Plain Password:', plainPassword);
    console.log('Hashed Password:', hashed);
    console.log('='.repeat(60));
    console.log('\n📋 SQL Update Command:');
    console.log(`UPDATE users SET password = '${hashed}' WHERE email = 'admin@transindopride.com';`);
    console.log('='.repeat(60) + '\n');
}

hashPassword().catch(console.error);
