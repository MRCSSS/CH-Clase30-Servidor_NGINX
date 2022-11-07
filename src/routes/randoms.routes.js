/* ============================ MODULOS ============================= */
import express from 'express';
import { fork } from 'child_process';
import {msgsDao} from '../daos/index.js';

/* ====================== INSTANCIA DE ROUTER ======================= */
const randoms = express.Router();
const forkedProcess = fork('./src/random-numbers.js');
/* ============================== RUTAS ============================= */
randoms.get('/randoms', (req, res) => {
    const qty = req.query.cant !== null && req.query.cant !== '' && req.query.cant !== undefined ? req.query.cant : 100000000 ;
    const qtyString = qty.toString();

    req.io.on('connection', async (socket) => {
        forkedProcess.send('Forked process STARTED');
        forkedProcess.send(qtyString);
        forkedProcess.on('message', msg => {
            let randomNumbersResult = JSON.parse(msg);
            socket.emit('serv-rNumbs', randomNumbersResult);
            console.log(`> Message received from forked process: Length of object: ${randomNumbersResult.length}`);
        });
   
        socket.emit('serv-rNumbs');
    });

    res.render('partials/randoms', {layout: 'random', cant: qty});
});

randoms.get('*', async (request, response) => {
    response.status(404).send('404 - Page not found!!');
});

/* ====================== MODULOS EXPORTADOS ======================== */
export default randoms;