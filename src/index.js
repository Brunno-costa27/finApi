const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const customers = [];

//middlewares

function verifyIfExistsAccountCPF(req,res,next){
    const { cpf } = req.headers;

    const customer = customers.find(customer => customer.cpf === cpf);// O método find() retorna o valor do primeiro elemento do array que satisfizer a função de teste

    if(!customer){

        return res.status(400).json({error: "Customer not found!"});
    }

    req.customer = customer;

    return next();

}

function getBalance(statement){

    const balance = statement.reduce((acu,operation) => {
        if(operation.type === 'credit'){
            return acu + operation.amount;
        }else{
            return acu - operation.amount;
        }
    },0)

    return balance;
}

app.post('/account', (req, res) => {
    const { cpf, nome } = req.body;

    const customersAlreadyExists = customers.some(
        (customer) => customer.cpf === cpf
    ); // O método some() testa se ao menos um dos elementos no array passa no teste implementado pela função atribuída e retorna um valor true ou false.

    if (customersAlreadyExists) {

        return res.status(400).json({ error: "Customer already exists!" });
    }

    customers.push({
        cpf,
        nome,
        id: uuidv4(),
        statement: [],
    });

    return res.status(201).send();

})

app.get('/statement',verifyIfExistsAccountCPF, (req,res) =>{
    const { customer } = req;

    return res.json(customer.statement);

})

app.post('/deposit', verifyIfExistsAccountCPF, (req,res) =>{

    const { description , amount } = req.body;

    const { customer } = req;

    const statementOperation = {

        description,
        amount,
        created_at : new Date(),
        type: "credit",
    } 

    customer.statement.push(statementOperation);

    return res.status(201).send();

})

app.post('/withdraw', verifyIfExistsAccountCPF,(req,res) =>{
    const { amount } = req.body;
    const { customer } = req;

    const balance = getBalance(customer.statement);

        if(balance < amount){

            return res.status(400).json({error: "Insufficient funds!"});
        }

        const statementOperation = {
            amount,
            created_at : new Date(),
            type: "debit",
        } 

        customer.statement.push(statementOperation);
        return res.status(201).send();
})

app.get('/statement/date',verifyIfExistsAccountCPF, (req,res) =>{
    const { customer } = req;
    const { date } = req.query;

    const dateFormat = new Date(date + "  00:00");
    
    const statement = customer.statement.filter((statement) => 
    statement.created_at.toDateString() ===
     new Date(dateFormat).toDateString());
        console.log(dateFormat);
        
    return res.json(statement);

})

app.put("/account", verifyIfExistsAccountCPF, (req,res) =>{

    const { nome } = req.body;
    const { customer } = req;

    customer.nome = nome;
    return res.status(201).send();

})

app.get("/account", verifyIfExistsAccountCPF, (req,res) =>{

    const { customer } = req;
    return res.json(customer);
})

app.delete("/account", verifyIfExistsAccountCPF,(req,res) =>{

    const { customer } = req;

    customers.splice(customer,1);

    return res.status(200).json(customers);

})

app.get("/balance", verifyIfExistsAccountCPF,(req,res) =>{

    const { customer } = req;

    const balance = getBalance(customer.statement);
    return res.json(balance);
})


app.listen(3333, () => {
    console.log("Rodando!");
});