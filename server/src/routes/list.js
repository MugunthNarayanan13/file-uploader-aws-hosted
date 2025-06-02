const express = require('express');
const AWS = require('aws-sdk');

const router = express.Router();
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;

router.get('/', async (req, res) => {
    try {
        const params = {
            TableName: TABLE_NAME,
        };
        const data = await dynamoDb.scan(params).promise();
        res.json(data.Items || []);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch data', details: err.message });
    }
});

module.exports = router;