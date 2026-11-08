// Every role, newest first, for the per-role pages (/work/<id>.html).
const work = require("./work.js");
module.exports = [...work.entries].sort((a, b) => b.start.localeCompare(a.start));
