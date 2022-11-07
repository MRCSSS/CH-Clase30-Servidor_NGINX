function getRandomNumbers(qty) {
    let rNumbs = [];
    console.log(` >> Start to count`);
    for(let i=0; i !== qty; i++ ) { 
        let newRandomNumber;
        let newNumb = Math.floor(Math.random() * (1001 - 1) + 1);
        const searchNumb = rNumbs.filter(num => num.number === newNumb);

        if (searchNumb[0] ){
            newRandomNumber = {number: searchNumb[0].number, quantity: searchNumb[0].quantity+1};
            const randonNumbs = rNumbs.map(numb => numb.number === searchNumb[0].number ? newRandomNumber : numb);
            rNumbs = randonNumbs;
        } else {
            newRandomNumber = {number: newNumb, quantity: 1};
            rNumbs.push(newRandomNumber);
        }
    }
    console.log(' >> Count finished');
    rNumbs.sort((a,b) => a.number > b.number ? 1 : a.number < b.number ? -1 : 0);
    console.log(' >> Numbers sorted');

    return rNumbs;
}

process.on('message', ( msg ) => {
    if (msg === 'Forked process STARTED') {
        console.log(`>>> ${msg}`);
    } else {
        let qty = parseInt(msg, 10);
        console.log(' >> Quantity of requested numbers:', qty);
        const rNumbers = JSON.stringify(getRandomNumbers(qty));
        process.send(rNumbers);
        console.log(`>>> Forked process FINISHED`);
    }
});