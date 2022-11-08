/* ============================ MODULOS ============================= */
import express from 'express';
import os from 'os';

/* ====================== INSTANCIA DE ROUTER ======================= */
const info = express.Router();

/* ============================== RUTAS ============================= */
info.get('/', (req, res) => {
    const args = process.argv.slice(2);
    let argsData = [];

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '-p') {
            argsData.push({port: args[i+1]});
            i++;
        } else if (args[i] === '-s') {
            argsData.push({serverMode: args[i+1].toUpperCase()});
            i++;
        } else {
            argsData.push({value: args[i]});
        }
    }

    res.render('partials/info-content', { 
        layout: 'info',
        cores: os.cpus().length, 
        info: process, 
        params: argsData,
        memUsage: process.memoryUsage(),
        directory: process.cwd()
    });
});


info.get('*', async (request, response) => {
    response.status(404).send('404 - Page not found!!');
});

/* ====================== MODULOS EXPORTADOS ======================== */
export default info;