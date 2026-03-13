const bcrypt = require('bcryptjs');
const password = 'AdminPassword123!';
const hash = bcrypt.hashSync(password, 10);
console.log(hash);
