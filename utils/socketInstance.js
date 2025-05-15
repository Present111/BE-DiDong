// src/utils/socketInstance.js
let io = null;

module.exports = {
    set: (newIo) => io = newIo,
    get: () => io
};
