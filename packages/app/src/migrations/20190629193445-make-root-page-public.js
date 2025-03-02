import mongoose from 'mongoose';

import { getMongoUri, mongoOptions } from '@growi/core';
import loggerFactory from '~/utils/logger';

const logger = loggerFactory('growi:migrate:make-root-page-public');

module.exports = {
  async up(db) {
    logger.info('Apply migration');
    mongoose.connect(getMongoUri(), mongoOptions);

    const Page = require('~/server/models/page')();

    await Page.findOneAndUpdate(
      { path: '/' },
      {
        grant: Page.GRANT_PUBLIC,
        grantedUsers: [],
        grantedGroup: null,
      },
    );

    logger.info('Migration has successfully applied');
  },

  down(db) {
    // do not rollback
  },
};
