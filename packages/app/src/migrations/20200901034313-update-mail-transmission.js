import mongoose from 'mongoose';

import { getMongoUri, mongoOptions } from '@growi/core';
import Config from '~/server/models/config';
import loggerFactory from '~/utils/logger';

const logger = loggerFactory('growi:migrate:update-mail-transmission');

module.exports = {
  async up(db, client) {
    logger.info('Apply migration');
    mongoose.connect(getMongoUri(), mongoOptions);

    const sesAccessKeyId = await Config.findOne({
      ns: 'crowi',
      key: 'mail:sesAccessKeyId',
    });
    const transmissionMethod = await Config.findOne({
      ns: 'crowi',
      key: 'mail:transmissionMethod',
    });

    if (sesAccessKeyId == null) {
      return logger.info('The key \'mail:sesAccessKeyId\' does not exist, value of transmission method will be set smtp automatically.');
    }
    if (transmissionMethod != null) {
      return logger.info('The key \'mail:transmissionMethod\' already exists, there is no need to migrate.');
    }

    const value = sesAccessKeyId.value != null
      ? JSON.stringify('ses')
      : JSON.stringify('smtp');

    await Config.create({
      ns: 'crowi',
      key: 'mail:transmissionMethod',
      value,
    });
    logger.info('Migration has successfully applied');

  },

  async down(db, client) {
    logger.info('Rollback migration');
    mongoose.connect(getMongoUri(), mongoOptions);

    // remote 'mail:transmissionMethod'
    await Config.findOneAndDelete({
      ns: 'crowi',
      key: 'mail:transmissionMethod',
    });

    logger.info('Migration has been successfully rollbacked');
  },
};
