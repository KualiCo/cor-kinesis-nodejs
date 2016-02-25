# Kuali Consumer

This is sample NodeJS code that consumes messages from an Amazon Kinesis stream provided by Kuali, logs it to a file named application.log (in the root directory), and then parses the message and saves it to a PostgreSQL database.  It is intended that you will change that part of the code to save changes to a database you use or perform some other action when you get messages from Kuali.

Also, the client state information is saved to Amazon DynamoDB, which is necessary to keep in sync.  

## Prerequisites

You should have Node 4 and Java installed.  You also need to get an AWS Access Key ID and Secret Access Key from Kuali.  This will have the privileges you need to read from the Kinesis stream, write to DynamoDB to save state information for the client, and push events to CloudWatch (for monitoring).

## Installation

Clone the repo
```
git clone https://github.com/KualiCo/kuali-consumer.git
```

Install dependencies
```
npm install
```

Modify the app.properties file to work in your environment (change streamName and applicationName to the stu-cm-<your_institution>)
```
vim app.properties
```

Update the .bash_profile or .profile file in the home directory of the user that will be running the app.  You will add the AWS environment variables that you received from Kuali.
```
vim ~/.bash_profile

export AWS_SECRET_ACCESS_KEY=<secret_key_provided_by_kuali>
export AWS_ACCESS_KEY_ID=<key_id_provided_by_kuali>
```

Source the newly updated .bash_profile or .profile, or log out and back in to get the updated environment variables

```
. ~/.bash_profile
```

## Use

Run by calling the bootstrap script, which will start the java app, which starts up the node app
```
./bin/kcl-bootstrap --java /usr/bin/java -e -p ./app.properties
```

## Notes

Be careful not to use the 'stderr'/'stdout'/'console' as log destination since it is used to communicate with the
<a href="https://github.com/awslabs/amazon-kinesis-client/blob/master/src/main/java/com/amazonaws/services/kinesis/multilang/package-info.java" target="_blank">MultiLangDaemon</a>.

Because of this, debugging can be a bit tricky.  Instead of logging to console.log, just log to log.info, and then check the application.log file.

## See also

* http://docs.aws.amazon.com/kinesis/latest/dev/kinesis-record-processor-implementation-app-nodejs.html
* http://docs.aws.amazon.com/kinesis/latest/dev/developing-consumers-with-kcl.html
