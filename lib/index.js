"use strict";

/**
 * Module dependencies
 */

/* eslint-disable no-unused-vars */
// Public node modules.
const _ = require("lodash");
const AWS = require("aws-sdk");

module.exports = {
  init(config) {
    const getBucket = (config, file) => {
      const targetBucket = config.buckets.find(({targetExtensions = []}) => targetExtensions.includes(file.ext))
      return targetBucket || config.buckets.find(b => b.default);
    }

    return {
      upload(file, customParams = {}) {
        const bucket = getBucket(config, file);
        const S3 = new AWS.S3({
          apiVersion: "2006-03-01",
          ...bucket.config,
        });

        return new Promise((resolve, reject) => {
          const path = file.path ? `${file.path}/` : "";
          const fileURL = `${path}${file.hash}${file.ext}`

          S3.upload(
            {
              Key: fileURL,
              Body: Buffer.from(file.buffer, "binary"),
              ACL: bucket.ACL || "public-read",
              ContentType: file.mime,
              ...customParams,
            },
            (err, data) => {
              if (err) {
                return reject(err);
              }
              if (bucket.CDN) {
                file.url = `${bucket.CDN}${data.Key}`;
              } else {
                file.url = data.Location;
              }

              if(bucket.ACL === 'private') {
                // this should happen when user buys this file not on upload!
                var params = {Bucket: bucket.config.params.Bucket, Key: fileURL, Expires: 60}; 
                var url = S3.getSignedUrl('getObject', params); // more info about S3 class - https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html
                console.log('The URL is', url); //signed URL for private file which can expire
              }

              resolve();
            }
          );
        });
      },
      delete(file, customParams = {}) {
        const bucket = getBucket(config, file);
        const S3 = new AWS.S3({
          apiVersion: "2006-03-01",
          ...bucket.config,
        });
        const path = file.path ? `${file.path}/` : "";
        const fileUrl = `${path}${file.hash}${file.ext}`

        return new Promise((resolve, reject) => {

          S3.deleteObject(
            {
              Key: fileUrl,
              ...customParams,
            },
            (err, data) => {
              if (err) {
                return reject(err);
              }

              resolve();
            }
          );
        });
      },
    };
  },
};
