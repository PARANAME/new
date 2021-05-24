const cool = require('cool-ascii-faces')
const express = require('express');
const { request } = require('http');
const path = require('path')
const { Pool } = require('pg');
const { isUndefined } = require('util');
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
    console.log('post_game:'+req.body.order);
    var ary = req.body.order.split(',');
    if (req.body.score==null){
      console.log("receipt_score is undefined");
    } else {
      console.log("receipt_score="+req.body.score);
    }

    var selectquery = 'select * from player where id in ('
    for (let i = 0; i <ary.length; ++i) {  
      if (i == ary.length-1){
        selectquery += ary[i]+')';
      } else {
        selectquery += ary[i]+',';
      }
    }
    selectquery += 'order by case id ';
    for (let i = 0; i <ary.length; ++i) {  
      if (i == ary.length-1){
        selectquery += 'when '+ary[i]+' then '+(i+1)+' end';
      } else {
        selectquery += 'when '+ary[i]+' then '+(i+1)+' ';
      }
    }
    console.log(selectquery);

    try {
      const client = await pool.connect()
      const result = await client.query(selectquery);
      /*const results = { 'results': (result) ? result.rows : null };*/
      console.log(result.row);
      
      var data = {
        Order:req.body.order,
        score:req.body.score,
        round:req.body.round,
        results:(result) ? result.rows : null
      }
      res.render('pages/game_start',data);
      client.release();
    } catch(err){
      console.error(err);
      res.send("Error "+err);
    }
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
      //const results = { 'results': (result) ? result.rows : null };
      var data = {
        score:'0,0,0,0',
        round:'0',
        results:(result) ? result.rows : null
      }
      //res.render('pages/player', results );
      res.render('pages/player', data );
      client.release();
    } catch(err){
      console.error(err);
      res.send("Error "+err);
    }
  })
  //post player is need to fix
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
      var data = {
        score:'0,0,0,0',
        round:'0',
        results:(result) ? result.rows : null
      }
      //res.render('pages/player', results );
      res.render('pages/player', data );
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