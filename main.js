/* ---------------------- MODULOS IMPORTADOS ------------------------ */
import httpServer from './src/server.js'
import minimist from "minimist";

/* -------------------------- INSTANCIANDO -------------------------- */
let options = {alias: {modo: 'm', p: 'port', d: 'debug'}, default: {p: 8080, m: 'prod', debug: false}};
let args =minimist(process.argv.slice(2), options)

/* ---------------------------- SERVIDOR ---------------------------- */
const server = httpServer.listen(args.port, () => {
    console.log(`Server listening: http://localhost:${args.port}`);
})

server.on('error', err => {
    console.log(`Server error: ${err}`);
})
