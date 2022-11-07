/* ============================ MODULOS ============================= */
import express from 'express';
import bcrypt from 'bcrypt';
import { usersDao } from '../daos/index.js';

/* ====================== INSTANCIA DE ROUTER ======================= */
const register = express.Router();

    /* ---------------- Encripado de Contraseña ---------------- */
async function generateHashPassword(password){
    const hashPassword = await bcrypt.hash(password, 10);
    return hashPassword;
}

/* ============================== RUTAS ============================= */
register.get('/', (req, res) => {
    res.render('partials/register', {layout: 'register'});
});

register.post('/', async (req, res)=>{
    const {username, password, email } = req.body;
    const userExists = await usersDao.searchUser(username);

    if (userExists !== null) {
        res.render('partials/register-error', {layout: 'register'});
    } else {
        const newUser = {username, password: await generateHashPassword(password), email};
        await usersDao.save(newUser);
        res.redirect('../login')
    }
})

register.get('*', async (request, response) => {
    response.status(404).send('404 - Page not found!!');
});

/* ====================== MODULOS EXPORTADOS ======================== */
export default register;