/**
 * Node libs load
 */
var rethinkDb = require('rethinkdb')
var assert = require('assert')
var logDebug = require('debug')('rdb:debug')
var logError = require('debug')('rdb:error')

/**
 * RethinkDb connection configuration
 */
var dbConfig = {
  host: process.env.RDB_HOST || 'localhost',
  port: parseInt(process.env.RDB_PORT) || 28015,
  db: process.env.RDB_DB || 'chat',
  tables: {
    'messages': 'id',
    'cache': 'cid',
    'users': 'id'
  }
}

/**
 * Connect to RethinkDb to initiate database
 */
module.exports.setup = function () {
  rethinkDb.connect(
    {
      host: dbConfig.host,
      port: dbConfig.port
    },
    function (err, connection) {
      assert.ok(err === null, err)

      // Create RethinkDb database and tables
      rethinkDb.dbCreate(dbConfig.db).run(
        connection,
        function (err, result) {
          if (err) {
            logDebug(
              "[DEBUG] RethinkDB database '%s' already exists (%s:%s)\n%s",
              dbConfig.db,
              err.name,
              err.msg,
              err.message
            )
          } else {
            logDebug(
              "[INFO ] RethinkDB database '%s' created",
              dbConfig.db
            )
          }

          // Create RethinkDb tables if do not exists
          for (var tbl in dbConfig.tables) {
            (function (tableName) {
              rethinkDb.db(dbConfig.db).tableCreate(
                tableName,
                {
                  primaryKey: dbConfig.tables[tbl]
                }
              ).run(
                connection,
                function (err, result) {
                  if (err) {
                    logDebug(
                      "[DEBUG] RethinkDB table '%s' already exists (%s:%s)\n%s",
                      tableName,
                      err.name,
                      err.msg,
                      err.message
                    )
                  } else {
                    logDebug("[INFO ] RethinkDB table '%s' created", tableName)
                  }
                }
              )
            })(tbl)
          }
        }
      )
    }
  )
}

/**
 * Filtering user by e-mail
 */
module.exports.findUserByEmail = function (mail, callback) {
  onConnect(function (err, connection) {
    if (err) {
      throw err
    }

    logDebug(
      "[INFO ][%s][findUserByEmail] Login {user: %s, pwd: 'you really thought I'd log it?'}",
      connection['_id'],
      mail
    )

    rethinkDb.db(dbConfig.db).table('users').filter({ 'mail': mail }).limit(1).run(connection, function (err, cursor) {
      if (err) {
        logError(
          '[ERROR][%s][findUserByEmail][collect] %s:%s\n%s',
          connection['_id'],
          err.name,
          err.msg,
          err.message
        )

        callback(err)
      } else {
        cursor.next(function (err, row) {
          if (err) {
            logError(
              '[ERROR][%s][findUserByEmail][collect] %s:%s\n%s',
              connection['_id'],
              err.name,
              err.msg,
              err.message
            )

            callback(null, null)
          } else {
            // Executes the callback with the user found
            callback(null, row)
          }
          connection.close()
        })
      }
    })
  })
}

/**
 * Filtering user by e-mail
 */
module.exports.findUserById = function (userId, callback) {
  onConnect(function (err, connection) {
    if (err) {
      throw err
    }

    rethinkDb.db(dbConfig['db']).table('users').get(userId).run(connection, function (err, result) {
      if (err) {
        logError(
          '[ERROR][%s][findUserById] %s:%s\n%s',
          connection['_id'],
          err.name,
          err.msg,
          err.message
        )

        callback(null, null)
      } else {
        // Executes callback with user found
        callback(null, result)
      }

      connection.close()
    })
  })
}

/**
 * Find all chat messages
 */
module.exports.findMessages = function (maxResults, callback) {
  onConnect(function (err, connection) {
    if (err) {
      throw err
    }

    rethinkDb.db(dbConfig['db']).table('messages').orderBy(rethinkDb.desc('timestamp')).limit(maxResults).run(connection, function (err, cursor) {
      if (err) {
        logError(
          '[ERROR][%s][findMessages] %s:%s\n%s',
          connection['_id'],
          err.name,
          err.msg,
          err.message
        )

        callback(null, [])

        connection.close()
      } else {
        cursor.toArray(function (err, results) {
          if (err) {
            logError(
              '[ERROR][%s][findMessages][toArray] %s:%s\n%s',
              connection['_id'],
              err.name,
              err.msg,
              err.message
            )

            callback(null, [])
          } else {
            // Executes callback with all results
            callback(null, results)
          }

          connection.close()
        })
      }
    })
  })
}

/**
 * Inserts a new message
 */
module.exports.saveMessage = function (msg, callback) {
  onConnect(function (err, connection) {
    if (err) {
      throw err
    }

    rethinkDb.db(dbConfig['db']).table('messages').insert(msg).run(connection, function (err, result) {
      if (err) {
        logError(
          '[ERROR][%s][saveMessage] %s:%s\n%s',
          connection['_id'],
          err.name,
          err.msg,
          err.message
        )

        callback(err)
      } else {
        // Executes callback according to insert result
        if (result.inserted === 1) {
          callback(null, true)
        } else {
          callback(null, false)
        }
      }

      connection.close()
    })
  })
}

/**
 * Saves a new user to database
 */
module.exports.saveUser = function (user, callback) {
  onConnect(function (err, connection) {
    if (err) {
      throw err
    }

    rethinkDb.db(dbConfig.db).table('users').insert(user).run(connection, function (err, result) {
      if (err) {
        logError(
          '[ERROR][%s][saveUser] %s:%s\n%s',
          connection['_id'],
          err.name,
          err.msg,
          err.message
        )

        callback(err)
      } else {
        // Executes callback according to success inserting user
        if (result.inserted === 1) {
          callback(null, true)
        } else {
          callback(null, false)
        }
      }

      connection.close()
    })
  })
}

/**
 * A wrapper to connect and execute callback on RethinkDb
 */
function onConnect (callback) {
  rethinkDb.connect({ host: dbConfig.host, port: dbConfig.port }, function (err, connection) {
    assert.ok(err === null, err)

    connection['_id'] = Math.floor(Math.random() * 10001)

    callback(err, connection)
  })
}
