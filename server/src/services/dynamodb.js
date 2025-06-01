const AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION,
});

const TABLE = process.env.DYNAMODB_TABLE_NAME;

exports.docClient = docClient;

exports.saveFileMeta = async (metadata) => {
  const params = {
    TableName: TABLE,
    Item: metadata,
  };

  await docClient.put(params).promise();
};

