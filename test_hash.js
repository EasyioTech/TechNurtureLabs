const bcrypt = require('bcryptjs');
const password = 'AdminPassword123!';
const hash = '$2b$10$Sk9UyIVPSe2I5lf9.R7QO.3O2TKys2Rly4Z2LbyTvn1sTde8mDtlu';
bcrypt.compare(password, hash).then(res => console.log('Match:', res));
