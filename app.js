var util = require('util')
var kcl = require('aws-kcl')
var logger = require('./logger')
var log = logger().getLogger('recordProcessor')

//this app is set up to asynchronously write to a postgres database.
//TODO: npm install drivers for your type of database (if different from postgres) and require them here

var co = require('co')
var pg = require('co-pg')(require('pg'))

var processRecord = co.wrap(function* (inMessageTopic, inMessageValue) {
  try {
    //TODO: enter correct database information for your database
    var connectionString = 'postgres://<username>:<password>@<hostname>:<port>/<db>'
    var connectionResults = yield pg.connectPromise(connectionString)
    var postgresClient = connectionResults[0]
    var done = connectionResults[1]

    //parse message value
    var parsedMessageValue = JSON.parse(inMessageValue)

    //get old and new value in the message body
    var oldVal = parsedMessageValue['1'].old_val
    var newVal = parsedMessageValue['1'].new_val
    var tableName = parsedMessageValue.tableName

    var query
    var values

    //delete
    if (newVal === null) {
      values = [oldVal.id]
      query = "DELETE FROM " + tableName + " WHERE id = $1"
      yield postgresClient.queryPromise(query, values)

    //insert
    } else if (oldVal === null) {
      values = [newVal.id, newVal.subjectCode, newVal.number]
      query = "INSERT INTO " + tableName + " (id, subjectcode, number) VALUES ($1, $2, $3)"
      yield postgresClient.queryPromise(query, values)

    //update
    } else {
      values = [newVal.id, newVal.subjectCode, newVal.number]
      query = "UPDATE " + tableName + " SET subjectcode = $2, number = $3 WHERE id = $1"
      yield postgresClient.queryPromise(query, values)

    }

    //call done to clean up database connection
    done()
  } catch(ex) {
    log.info(ex.toString())
  }
})

function recordProcessor() {
  var shardId

  return {

    initialize: function(initializeInput, completeCallback) {
      shardId = initializeInput.shardId
      completeCallback()
    },

    processRecords: function(processRecordsInput, completeCallback) {
      if (!processRecordsInput || !processRecordsInput.records) {
        completeCallback()
        return
      }
      var records = processRecordsInput.records
      var record, data, sequenceNumber, partitionKey
      for (var i = 0; i < records.length; ++i) {
        record = records[i]
        data = new Buffer(record.data, 'base64').toString()
        sequenceNumber = record.sequenceNumber
        partitionKey = record.partitionKey

        //log record from Kinesis out to a log file
        log.info(util.format('ShardID: %s, Record: %s, SeqenceNumber: %s, PartitionKey:%s', shardId, data, sequenceNumber, partitionKey))

        //process record - in this case, we parse JSON and write to a postgres database
        processRecord(partitionKey, data)
      }
      if (!sequenceNumber) {
        completeCallback()
        return
      }
      // If checkpointing, completeCallback should only be called once checkpoint is complete.
      processRecordsInput.checkpointer.checkpoint(sequenceNumber, function(err, sequenceNumber) {
        log.info(util.format('Checkpoint successful. ShardID: %s, SeqenceNumber: %s', shardId, sequenceNumber))
        completeCallback()
      })
    },

    shutdown: function(shutdownInput, completeCallback) {
      // Checkpoint should only be performed when shutdown reason is TERMINATE.
      if (shutdownInput.reason !== 'TERMINATE') {
        completeCallback()
        return
      }
      // Whenever checkpointing, completeCallback should only be invoked once checkpoint is complete.
      shutdownInput.checkpointer.checkpoint(function(err) {
        completeCallback()
      })
    }
  }
}

kcl(recordProcessor()).run()
