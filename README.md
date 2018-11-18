# Chat with RethinkDb + Node.js + Socket.io + Express

Simple chat test based on [rethinkdb/rethinkdb-example-nodejs-chat](https://github.com/rethinkdb/rethinkdb-example-nodejs-chat)

* [node.js](http://nodejs.org)
* [socket.io](http://socket.io)
* [express](http://expressjs.com) and [jade](http://jade-lang.com)
* [Passport](http://passportjs.org) and [bcrypt](https://github.com/ncb000gt/node.bcrypt.js/)
* [debug](https://github.com/visionmedia/debug)
* [RethinkDB](http://www.rethinkdb.com/)

# Installation

Clone the project and execute: 

```
npm install
```

Run composer:

```
docker-compose up -d
```

# To run the application

```
node app
```
Then open a browser: <http://localhost:8000>.

### To override RethinkDb configuration

Specify them as environment variables:

* `RDB_HOST` (default: `localhost`)
* `RDB_PORT` (default `28015`)
* `RDB_DB` (default: `chat`)

### To enable logging for DB queries

```
DEBUG=rdb:* node app
```

For more configuration options: (see [debug docs](https://github.com/visionmedia/debug)

# Execute standard checks
 
 ```
npm run standard
```
