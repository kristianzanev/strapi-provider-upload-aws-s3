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

    return {
      upload(file, customParams = {}) {
        const isPrivateExtension = config.privateExt === file.ext;
        const s3Config = isPrivateExtension ? config.private : config.default;
        const S3 = new AWS.S3({
          apiVersion: "2006-03-01",
          ...s3Config,
        });

        return new Promise((resolve, reject) => {
          const path = file.path ? `${file.path}/` : "";
          S3.upload(
            {
              Key: `${path}${file.hash}${file.ext}`,
              Body: Buffer.from(file.buffer, "binary"),
              ACL: "public-read",
              ContentType: file.mime,
              ...customParams,
            },
            (err, data) => {
              if (err) {
                return reject(err);
              }
              if (config.CDN) {
                file.url = `${config.CDN}${data.Key}`;
              } else {
                file.url = data.Location;
              }

              resolve();
            }
          );
        });
      },
      delete(file, customParams = {}) {
        const isPrivateExtension = config.privateExt === file.ext;
        const s3Config = isPrivateExtension ? config.private : config.default;
        const S3 = new AWS.S3({
          apiVersion: "2006-03-01",
          ...s3Config,
        });

        return new Promise((resolve, reject) => {
          const path = file.path ? `${file.path}/` : "";

          S3.deleteObject(
            {
              Key: `${path}${file.hash}${file.ext}`,
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
