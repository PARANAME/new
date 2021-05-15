const cool = require('cool-ascii-faces')
const express = require('express');
const { request } = require('http');
const path = require('path')
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
const PORT = process.env.PORT || 5000

express()
  .use(express.static(path.join(__dirname, 'public')))
  .use(express.json()) // for parsing application/json
  .use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .get('/game', (req, res) => {
    console.log("game")
    var data = {
      Order:''
    };
    res.render('pages/game_start',data);
  })
  .post('/game',async(req, res, next) => {
    //var msg = req.body['order'];
    //res.setHeader('Content-Type', 'text/plain');
    var ary = req.body.order.split(',');

    var selectquery = ''
    for (let i = ary.length-1; i >=0; i--) {
      if (i!=0){
        selectquery += 'select * from player where id ='+ary[i]+' union ';
      } else {
        selectquery += 'select * from player where id ='+ary[i];
      }
    }
    try {
      const client = await pool.connect()
      const result = await client.query(selectquery);
      /*const results = { 'results': (result) ? result.rows : null };*/
      console.log(results);
      
      var data = {
        Order:req.body.order,
        results:(result) ? result.rows : null
      }
      res.render('pages/game_start',data);
      client.release();
    } catch(err){
      console.error(err);
      res.send("Error "+err);
    }
    /*
    var data = {
      Order:req.body.order
    };
    */
  })
  .get('/db', async(req,res)=>{
    try {
      const client = await pool.connect()
      const result = await client.query('SELECT * FROM test_table');
      const results = { 'results': (result) ? result.rows : null };
      res.render('pages/db', results );
      client.release();
    } catch(err){
      console.error(err);
      res.send("Error "+err);
    }
  })
  .get('/player', async(req,res)=>{
    try {
      const client = await pool.connect()
      const result = await client.query('SELECT * FROM player');
      const results = { 'results': (result) ? result.rows : null };
      res.render('pages/player', results );
      client.release();
    } catch(err){
      console.error(err);
      res.send("Error "+err);
    }
  })
  .post('/player', async(req,res)=>{
    console.log(req.body.add_name+","+req.body.add_class);
    
    try {
      const client = await pool.connect()
      const result_max = await client.query('SELECT max(id) FROM player');
      
      console.log(result_max);

      var maxid = result_max.rows[0].max;
      maxid += 1;
      console.log("maxid:"+maxid);

      const text = 'INSERT INTO player VALUES($1, $2, $3, $4)'
      const values = [maxid,req.body.add_name,req.body.add_class,'icon_test.png']
      // callback
      client.query(text, values, (err, res) => {
        if (err) {
          console.log(err.stack)
        } else {
          console.log(res.rows[maxid])
        }
      })

      const result = await client.query('SELECT * FROM player');
      const results = { 'results': (result) ? result.rows : null };
      res.render('pages/player', results );
      client.release();
    } catch(err){
      console.error(err);
      res.send("Error "+err);
    }
  })
  .get('/cool',(req,res) => res.send(cool()))
  .get('/times',(req,res)=> res.send(showTimes()))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))

  showTimes = () => {
    let result =''
    const times = process.env.TIMES || 5
    for (i = 0; i< times; i++){
      result += i + ' '
    }
    return result;
  }