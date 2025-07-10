// Script untuk generate hash password
const bcrypt = require('bcryptjs');

const password = 'edi';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
        console.error('Error hashing password:', err);
        return;
    }

    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('\nSQL Query untuk update admin edi:');
    console.log(`UPDATE admin SET password = '${hash}' WHERE username = 'edi';`);
});
