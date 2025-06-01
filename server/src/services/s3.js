const AWS = require("aws-sdk");
const s3 = new AWS.S3({ region: process.env.AWS_REGION });

const BUCKET = process.env.S3_BUCKET_NAME;

exports.uploadToS3 = async (key, file) => {
  const params = {
    Bucket: BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  await s3.putObject(params).promise();
};
