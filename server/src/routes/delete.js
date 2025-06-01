const express = require("express");
const AWS = require("aws-sdk");
const dynamodb = require("../services/dynamodb");
const s3 = new AWS.S3({ region: process.env.AWS_REGION });

const router = express.Router();
const BUCKET = process.env.S3_BUCKET_NAME;
const TABLE = process.env.DYNAMODB_TABLE_NAME;

// Helper to delete multiple S3 objects by keys
async function deleteS3Objects(keys) {
  if (!keys.length) return;
  const params = {
    Bucket: BUCKET,
    Delete: {
      Objects: keys.map((Key) => ({ Key })),
      Quiet: false,
    },
  };
  await s3.deleteObjects(params).promise();
}

// Helper to delete multiple DynamoDB items by file_id (batch)
async function deleteDynamoItemsByFileIds(fileIds) {
  if (!fileIds.length) return;

  // DynamoDB batchWrite allows max 25 at once
  const chunks = [];
  for (let i = 0; i < fileIds.length; i += 25) {
    chunks.push(fileIds.slice(i, i + 25));
  }

  for (const chunk of chunks) {
    const deleteRequests = chunk.map((file_id) => ({
      DeleteRequest: { Key: { file_id } },
    }));

    const params = {
      RequestItems: {
        [TABLE]: deleteRequests,
      },
    };

    await dynamodb.docClient.batchWrite(params).promise();
  }
}

router.delete("/", async (req, res) => {
  try {
    const { path, key } = req.body; // accept either

    if (!path && !key) {
      return res
        .status(400)
        .json({ error: "Provide either path (folder) or key (file)" });
    }

    if (key) {
      // Delete single file

      // 1. Delete from S3
      await s3.deleteObject({ Bucket: BUCKET, Key: key }).promise();

      // 2. Delete metadata from DynamoDB by querying with s3_key = key
      const params = {
        TableName: TABLE,
        IndexName: "s3_key-index", // You need to create this GSI on s3_key attribute
        KeyConditionExpression: "s3_key = :key",
        ExpressionAttributeValues: { ":key": key },
      };
      const result = await dynamodb.docClient.query(params).promise();

      const fileIds = result.Items.map((item) => item.file_id);
      await deleteDynamoItemsByFileIds(fileIds);

      return res.json({ message: `Deleted file ${key}` });
    }

    if (path) {
      // Delete folder (all files with prefix)

      // 1. List all objects in S3 with prefix = path
      const listedObjects = await s3
        .listObjectsV2({ Bucket: BUCKET, Prefix: path })
        .promise();

      if (listedObjects.Contents.length === 0) {
        return res
          .status(404)
          .json({ error: "No files found for given folder path" });
      }

      const keysToDelete = listedObjects.Contents.map((obj) => obj.Key);

      // 2. Delete all objects in S3 (handle batching if > 1000 objects)
      const chunkSize = 1000;
      for (let i = 0; i < keysToDelete.length; i += chunkSize) {
        const chunk = keysToDelete.slice(i, i + chunkSize);
        await deleteS3Objects(chunk);
      }

      // 3. Query and delete DynamoDB metadata for these keys
      // DynamoDB doesn’t support batch query by arbitrary keys easily.
      // So instead, do a scan with filter expression on 'path' attribute starting with 'path'
      let fileIdsToDelete = [];
      let ExclusiveStartKey;
      do {
        const scanParams = {
          TableName: TABLE,
          FilterExpression: "begins_with(#p, :prefix)",
          ExpressionAttributeNames: { "#p": "path" },
          ExpressionAttributeValues: { ":prefix": path },
          ExclusiveStartKey,
        };
        const scanResult = await dynamodb.docClient.scan(scanParams).promise();
        fileIdsToDelete.push(...scanResult.Items.map((item) => item.file_id));
        ExclusiveStartKey = scanResult.LastEvaluatedKey;
      } while (ExclusiveStartKey);

      await deleteDynamoItemsByFileIds(fileIdsToDelete);

      return res.json({
        message: `Deleted folder and files under path ${path}`,
      });
    }
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

module.exports = router;
