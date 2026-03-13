const bcrypt = require('bcryptjs');
const hash = '$2b$10$Sk9UyIVPSe2I5lf9.R7QO.3O2TKys2Rly4Z2LbyTvn1sTde8mDtlu';
const password = 'AdminPassword123!';
console.log('Match:', bcrypt.compareSync(password, hash));
