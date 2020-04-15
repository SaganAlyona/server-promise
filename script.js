import * as http from 'http';
import { Collection } from './collection.js';
import {  readFileSync } from 'fs';
import { parse } from 'querystring';
import Mustache from 'mustache';

const PORT = process.env.PORT || 5000;

const collection = new Collection('homeworks');

const templates = {
  list: readFileSync('./templates/list.html', 'utf8'),
  homework: readFileSync('./templates/homework.html', 'utf8'),
  css: readFileSync('./public/style.css', 'utf8'),
};

/**
 * @param {http.IncomingMessage} req
 */
const readBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', data => {
      body = body + data.toString('utf8');
    });

    req.on('end', async () => {
      resolve(parse(body));
    });

    req.on('error', error => reject(error));
  });
};

/**
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
const requestHandler = async (req, res) => {
  const send = (status, data) =>{
    res.writeHead(status);
    if (data) {
      const body = (typeof data === 'string') ? data : (JSON.stringify(data));
      res.write(body);
    }
    res.end();
  };

  
  if (req.url === '/style.css' && req.method === 'GET') {
    send(200, templates.css);
    return;
  }
  
  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(302, { Location: '/homeworks'});
    res.end();
    return;
  }

  if (req.url.startsWith('/homeworks')) { 
    if (req.method === 'GET' && (req.url === '/homeworks' || req.url === '/homeworks/')) {
      const data = await collection.list();
      send(200, Mustache.render(templates.list, { title: 'Homeworks', rows: data}));
      return;
    }

    if (req.url.startsWith('/homeworks/new')) {
      const newLesson = 'undefined';
      switch(req.method){
      case 'GET':{
        const body = Mustache.render(templates.homework, newLesson);
        send(200, body);
      }
        break;
      case 'POST':{
        const updateDate = await readBody(req);
        await collection.insertOne(updateDate);
        res.writeHead(302, { Location: req.url });
        res.end();
        break;
      }
      }
      return;
    }

    if (req.url.startsWith('/homeworks/')) {
      const id = req.url.substring('/homeworks/'.length);
      const homework = await collection.findOne({ id });
      switch(req.method){
      case 'GET':
        if(homework){
          const body = Mustache.render(templates.homework, homework);
          send(200, body);
        }else{
          send(404);
        }
        break;
      case 'POST': {
        const updateDate = await readBody(req);
        const updateBody = Object.assign({}, homework, updateDate);
        await collection.updateOne(homework.id, updateBody);
        res.writeHead(302, { Location: req.url });
        res.end();
        break; 
      }
      case 'DELETE':{
        const id = req.url.slice(11);
        await collection.deleteId(id);
        res.writeHead(200);
        res.end();
        break;
      }
      }
      return;
    }
  }
  res.writeHead(404);
  res.end();
};

const server = http.createServer(requestHandler);
server.on('listening', () => console.log(`Listening on port: ${PORT}`));
server.listen(PORT);

