const AWS = require('aws-sdk');

const storjClient = new AWS.S3({
    endpoint: 'https://gateway.storjshare.io', // STORJ S3-compatible endpoint
    accessKeyId: 'jx6z3hmyml7kyja2caiu632dabjq',      // Replace with your Access Key ID
    secretAccessKey: 'jz2k7qthezbxl2sx2h2ln7vdv36qe4srsai6fwfpzbla5tkg22hyo', // Replace with your Secret Access Key
    s3ForcePathStyle: true,                   // Required by STORJ
    signatureVersion: 'v4',                   // Required for S3 compatibility
});


module.exports = storjClient;