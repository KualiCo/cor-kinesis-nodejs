# Core Consumer

This is sample NodeJS code that consumes messages from an Amazon Kinesis stream provided by Kuali, logs it to a file named application.log (in the root directory), and then parses the message and saves it to a PostgreSQL database.  It is intended that you will change that part of the code to save changes to a database you use or perform some other action when you get messages from Kuali.

Also, the client state information is saved to Amazon DynamoDB, which is necessary to keep in sync.  

## Prerequisites

- Install git
- Install NodeJS 4.3 or higher
- Install Java 1.7 or higher
- Get an AWS Access Key ID and Secret Access Key from Kuali.  This will have the privileges you need to read from the Kinesis stream, write to DynamoDB to save state information for the client, and push events to CloudWatch (for monitoring).

## Installation

Clone the repo
```
git clone https://github.com/KualiCo/core-consumer-nodejs.git
```

Install dependencies
```
npm install
```

Modify the app.properties file to work in your environment by changing the streamName and applicationName to cor-consumer-`<environment>`-stu-cm-`<institution>` where `<institution>` is the url name of your institution (e.g., monsters, byu, coventry, etc.), and <environment> is tst, sbx, stg, or prd.
```
vim app.properties
```

Update the .bash_profile or .profile file in the home directory of the user that will be running the app.  You will add the AWS environment variables that you received from Kuali.
```
vim ~/.bash_profile

export AWS_SECRET_ACCESS_KEY=<secret_key_provided_by_kuali>
export AWS_ACCESS_KEY_ID=<key_id_provided_by_kuali>
```

Source the newly updated .bash_profile or .profile, or log out and back in to get the updated environment variables.

```
. ~/.bash_profile
```

Make changes to the app.js code so it will not only log messages, but also update make changes to databases and take other actions.

## Use

Run by calling the bootstrap script, which will start the java app, which starts up the node app
```
./bin/kcl-bootstrap --java /usr/bin/java -e -p ./app.properties
```
With it running, as you make changes in your Kuali application (e.g., Curriculum Management, Kuali Research, etc.), those changes will be logged to the application.log file.  They will also be written to databases and and other actions that you have defined in the code will be performed.

## Message Format

Messages will be in JSON and look similar to those listed below.

When it is an insert, old_val will be null:

```
{  
   "0":null,
   "1":{  
      "new_val":{  
         "created":1456503966314,
         "createdBy":"1281228650558160821",
         "id":"36f7dd5a-05a3-4f27-b9d7-2126e0a8b78e",
         "meta":{  
            "proposalType":"create"
         },
         "pid":"Eyk6svYil",
         "status":"draft",
         "updated":1456503967380
      },
      "old_val":null
   },
   "id":"cc7a4d49-639f-5d95-0f6e-cf03c9880163",
   "tableName":"courses",
   "institution":"monsters",
   "environment":"stg"
}
```

When it is an update, old_val and new_val will not be null:

```
{  
   "0":null,
   "1":{  
      "new_val":{  
         "created":1456503966314,
         "createdBy":"1281228650558160821",
         "id":"36f7dd5a-05a3-4f27-b9d7-2126e0a8b78e",
         "meta":{  
            "proposalType":"create"
         },
         "pid":"Eyk6svYil",
         "status":"draft",
         "updated":1456503967380
      },
      "old_val":{  
         "created":1456503966314,
         "createdBy":"1281228650558160821",
         "id":"36f7dd5a-05a3-4f27-b9d7-2126e0a8b78e",
         "meta":{  
            "proposalType":"create"
         },
         "pid":"Eyk6svYil",
         "status":"draft"
      }
   },
   "id":"a88fc106-c2f3-6b84-805a-e040fecf54a3",
   "tableName":"courses",
   "institution":"monsters",
   "environment":"stg"
}
```

When it is a delete, new_val will be null:

```
{  
   "0":null,
   "1":{  
      "new_val":null,
      "old_val":{  
         "created":1456434468850,
         "createdBy":"1281228650558160821",
         "description":"test",
         "id":"a6855169-b829-49cb-9c53-5409e2dd9eb2",
         "meta":{  
            "proposalType":"create"
         },
         "pid":"EyBrh8uol",
         "proposalRationale":"this will be a great class",
         "startTerm":{  
            "year":"2016"
         },
         "status":"draft",
         "transcriptTitle":"test",
         "updated":1456434544370
      }
   },
   "id":"3684bc95-d505-1a07-539d-e29ff1525b94",
   "tableName":"courses",
   "institution":"monsters",
   "environment":"stg"
}
```

Possible tables for CM are:
- actionlists
- actionlogs
- config
- courses (includes course proposals)
- definitions
- experiences
- files
- groups
- instances
- logbot
- options
- pgroups
- programs (includes program proposals)
- specializations

## Notes

Be careful not to use the 'stderr'/'stdout'/'console' as log destination since it is used to communicate with the
<a href="https://github.com/awslabs/amazon-kinesis-client/blob/master/src/main/java/com/amazonaws/services/kinesis/multilang/package-info.java" target="_blank">MultiLangDaemon</a>.

Because of this, debugging can be a bit tricky.  Instead of logging to console.log, just log to log.info, and then check the application.log file.

## See also

* http://docs.aws.amazon.com/kinesis/latest/dev/kinesis-record-processor-implementation-app-nodejs.html
* http://docs.aws.amazon.com/kinesis/latest/dev/developing-consumers-with-kcl.html
