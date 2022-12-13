const express = require('express');
const Decimal = require('decimal.js')
const fs = require('fs')
const cors = require('cors')

//setting up server with express
const app = express()
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({extended: true}))
app.use(cors())
app.options('*', cors())

// calculating operation using decimal.js 
// and callback nodeActions to work with the results

const doMath = (operand1 = 0, operator, operand2 = 0, callback) => {
    operand1 = new Decimal(operand1);
    operand2 = new Decimal(operand2);

    //operators

    switch(operator){
        case "*":
            return callback({result: operand1.mul(operand2).toNumber(), calc: `${operand1} * ${operand2}`});
        
        case "/":
            return callback({result: operand1.div(operand2).toNumber(), calc: `${operand1} / ${operand2}`});
        
        case "+":
            return callback({result: operand1.plus(operand2).toNumber(), calc: `${operand1} + ${operand2}`});
                    
        case "-":
            return callback({result: operand1.sub(operand2).toNumber(), calc: `${operand1} - ${operand2}`});
        
        case "**":
            return callback({result: operand1.toPower(operand2).toNumber(), calc: `pow(${operand1}, ${operand2})`});
        
        case "log":
            return callback({result: operand1 * log10(operand2).toNumber(), calc: `${operand1} * log10(${operand2})`});
                 
        case "ln":
            return callback({result: operand1 * log(operand2).toNumber(), calc: `${operand1} * log(${operand2})`});

        default:
            return "Unknown operation"

    }
}

function nodeActions(data) {
    fs.appendFile('calculations.txt', `${data.calc} = ${data.result}\n`, function (err) {
        if (err) throw err;
        console.log('Last calculation saved into calculations.txt');
    });
    return data;
}

app.post('/mathController', (req, res) => res.json(doMath(req.body.operand1, req.body.operator, req.body.operand2, nodeActions)));

app.get('/', (req, res) => res.send('<h1>Calculator Backend - Please make sure to use a post request<h2>'));

app.listen(port, () => console.log(`Calculator Node API listening on port ${port}!`));