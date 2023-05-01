require('dotenv').config();
const port = process.env.PORT;
const express = require('express');
const app = express();
const layout = require('express-ejs-layouts');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const nocache = require('nocache');
const config = require('./config/config');
config.mongooseConnection()


 

const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin')
//static Files
app.use(express.static('public'))
app.use('/css',express.static(__dirname+'public/css'));
app.use('/js',express.static(__dirname+'public/js'));
app.use('/fonts',express.static(__dirname+'public/fonts'));
app.use('/images',express.static(__dirname+'public/images'));



//set engine
app.use(layout);
app.set('layout','./layout/layout')
app.set('view engine','ejs')

app.use(cookieParser());
app.use(session({
    secret:process.env.SESIONSECRET,
    saveUninitialized:true,
    resave:false,
    cookie:{
        maxAge:1000 * 60 * 24 * 10
    }
}));
app.use(nocache());





//routs
app.use('/',userRouter)
app.use('/admin',adminRouter)


//404 error
app.get('*',(req,res)=>{
    res.status(404),res.render('404')
})
app.listen(port,()=> console.log(`server connected ${port}...`));